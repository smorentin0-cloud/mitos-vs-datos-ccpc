/*
 * «Pregúntale a Boleta»: motor del chatbot sin LLM, sin red y sin DOM (se prueba con
 * node scripts/probar_chat.js).
 *
 * 1. Normaliza la pregunta: minúsculas, sin acentos ni signos.
 * 2. Saca los datos: años y estados (con alias y tolerando faltas: «chiwawa» → Chihuahua);
 *    los cambia por _anio y _estado para que «cuánto votó Jalisco» y «cuánto votó Sonora» se parezcan.
 * 3. Corrige faltas contra las palabras conocidas, cambia sinónimos, quita palabras vacías y recorta
 *    terminaciones («votaron», «votantes» → «vot»).
 * 4. Compara con las preguntas de ejemplo de cada intención (TF-IDF por palabras + trigramas de letras,
 *    o qué tanto del ejemplo contiene la pregunta) y gana la más parecida. Si ninguna pasa el umbral,
 *    no adivina: dice que no sabe y sugiere preguntas. Las preguntas dobles («… y cómo …») se responden por partes.
 * 5. Llena la plantilla con cifras de atlas.json y mitos.json (generadas por los scripts).
 *
 * El contexto (último estado, año e intención) vive solo en memoria, en el objeto que crea nuevoContexto().
 */
const ChatMotor = (() => {
  const UMBRAL = 0.4;
  const PESO_PALABRAS = 0.75;
  // En preguntas largas el parecido se diluye; si la pregunta contiene casi todo un ejemplo (de 2 palabras o más),
  // también cuenta, con este peso.
  const PESO_CONTIENE = 0.85;

  const normal = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

  // Recorte simple de terminaciones del español; deja al menos 4 letras.
  const TERMINACIONES = ["aciones", "acion", "antes", "ante", "aron", "ieron", "ando", "iendo", "aban", "ados", "adas",
    "ado", "ada", "an", "en", "ar", "er", "ir", "as", "es", "os", "a", "e", "o", "s"];
  function raiz(p) {
    if (p.startsWith("_")) return p;
    for (const t of TERMINACIONES) {
      if (p.endsWith(t) && p.length - t.length >= 4) return p.slice(0, -t.length);
    }
    return p;
  }

  // Distancia de edición (Levenshtein) con salida temprana si pasa del máximo.
  function distancia(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i += 1) {
      const fila = [i];
      let menor = i;
      for (let j = 1; j <= b.length; j += 1) {
        fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        menor = Math.min(menor, fila[j]);
      }
      if (menor > max) return max + 1;
      previa = fila;
    }
    return previa[b.length];
  }
  const tolerancia = (p) => (p.length >= 8 ? 2 : p.length >= 4 ? 1 : 0);
  // Los nombres de estados se escriben de muchas formas («chiwawa», «veracrus»): un poco más de tolerancia.
  const toleranciaEstado = (p) => (p.length >= 9 ? 3 : p.length >= 6 ? 2 : 1);

  // Cómo suena en español, para comparar nombres de estados: «chiwawa» ≈ «chihuahua», «oajaca» ≈ «oaxaca».
  const fonetica = (p) => p
    .replace(/ch/g, "§").replace(/[hg]u(?=[aeio])/g, "w").replace(/h/g, "")
    .replace(/qu/g, "k").replace(/c(?=[ei])/g, "s").replace(/c/g, "k").replace(/z/g, "s")
    .replace(/v/g, "b").replace(/ll/g, "y").replace(/x/g, "j").replace(/§/g, "ch");

  function trigramas(texto) {
    const s = `  ${texto} `;
    const conteo = new Map();
    for (let i = 0; i < s.length - 2; i += 1) {
      const g = s.slice(i, i + 3);
      conteo.set(g, (conteo.get(g) || 0) + 1);
    }
    return conteo;
  }
  function dice(a, b) {
    let comun = 0, total = 0;
    a.forEach((n, g) => { comun += Math.min(n, b.get(g) || 0); total += n; });
    b.forEach((n) => { total += n; });
    return total ? (2 * comun) / total : 0;
  }

  function crear({ chat, atlas, mitos, textos }) {
    const T = textos.chat;
    const pct = textos.atlas.pct;
    const puntos = textos.atlas.puntos;
    const vacias = new Set(chat.vacias);
    const { sinonimos } = chat;
    const alias = Object.entries(chat.alias_estados)
      .map(([a, c]) => ({ a, f: fonetica(a), c: Number(c), n: a.split(" ").length }));
    const aliasExacto = Object.fromEntries(alias.map((x) => [x.a, x.c]));
    const porClave = Object.fromEntries(atlas.estados.map((e) => [e.clave, e]));
    const listaMitos = mitos.niveles.flatMap((n) => n.mitos);
    const porId = Object.fromEntries(chat.intenciones.map((i) => [i.id, i]));

    // Palabras conocidas: las de los ejemplos y los sinónimos. Contra ellas se corrigen las faltas.
    const conocidas = new Set([...Object.keys(sinonimos), ...chat.vacias]);
    chat.intenciones.forEach((i) => i.ejemplos.forEach((e) => normal(e).split(" ").forEach((p) => conocidas.add(p))));
    const conocidasLista = [...conocidas].filter((p) => p.length >= 4 && !/^\d+$/.test(p));

    function corregir(p) {
      if (conocidas.has(p) || /^\d+$/.test(p) || p.length < 4) return p;
      const max = tolerancia(p);
      let mejor = null, mejorD = max + 1;
      for (const c of conocidasLista) {
        const d = distancia(p, c, max);
        if (d < mejorD) { mejor = c; mejorD = d; }
      }
      return mejor || p;
    }

    // Estados (frases de hasta 5 palabras, primero las más largas) y años; los demás tokens se corrigen.
    function extraer(tokens) {
      const estados = [], anios = [], salida = [];
      let i = 0;
      while (i < tokens.length) {
        const tk = tokens[i];
        if (/^(19|20)\d\d$/.test(tk)) { anios.push(Number(tk)); salida.push("_anio"); i += 1; continue; }
        let hallado = null;
        for (let n = Math.min(5, tokens.length - i); n >= 1 && !hallado; n -= 1) {
          const frase = tokens.slice(i, i + n).join(" ");
          if (aliasExacto[frase] !== undefined) hallado = { c: aliasExacto[frase], n };
          else if (frase.length >= 5 && !(n === 1 && conocidas.has(frase))) {
            const f = fonetica(frase);
            const parecido = alias.find((x) => x.n === n && x.a.length >= 5
              && distancia(f, x.f, toleranciaEstado(x.f)) <= toleranciaEstado(x.f));
            if (parecido) hallado = { c: parecido.c, n };
          }
        }
        if (hallado) {
          if (!estados.includes(hallado.c)) estados.push(hallado.c);
          salida.push("_estado");
          i += hallado.n;
          continue;
        }
        salida.push(corregir(tk));
        i += 1;
      }
      return { salida, estados, anios };
    }

    const terminos = (salida) => salida
      .map((t) => (t.startsWith("_") ? t : sinonimos[t] || t))
      .filter((t) => !vacias.has(t))
      .map(raiz);

    // ---------- vectores TF-IDF de los ejemplos
    const ejemplos = [];
    chat.intenciones.forEach((i) => i.ejemplos.forEach((texto) => {
      ejemplos.push({ intencion: i, terms: terminos(extraer(normal(texto).split(" ").filter(Boolean)).salida) });
    }));
    const df = new Map();
    ejemplos.forEach((e) => new Set(e.terms).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
    const idf = (t) => Math.log(1 + ejemplos.length / (df.get(t) || 0.5));
    function vector(terms) {
      const v = new Map();
      terms.forEach((t) => v.set(t, (v.get(t) || 0) + idf(t)));
      let norma = 0;
      v.forEach((x) => { norma += x * x; });
      return { v, norma: Math.sqrt(norma) };
    }
    const coseno = (a, b) => {
      if (!a.norma || !b.norma) return 0;
      let s = 0;
      a.v.forEach((x, t) => { s += x * (b.v.get(t) || 0); });
      return s / (a.norma * b.norma);
    };
    ejemplos.forEach((e) => {
      e.vec = vector(e.terms);
      e.tri = trigramas(e.terms.join(" "));
      e.unicos = [...new Set(e.terms)];
      e.pesoTotal = e.unicos.reduce((s, t) => s + idf(t), 0);
    });

    function puntuar(terms) {
      const q = vector(terms), tri = trigramas(terms.join(" "));
      const enPregunta = new Set(terms);
      const mejores = new Map();
      ejemplos.forEach((e) => {
        const parecido = PESO_PALABRAS * coseno(q, e.vec) + (1 - PESO_PALABRAS) * dice(tri, e.tri);
        // Solo cuenta si coincide al menos una palabra real (no solo _estado o _anio).
        const contiene = e.unicos.length >= 2 && e.unicos.some((t) => !t.startsWith("_") && enPregunta.has(t))
          ? e.unicos.reduce((s, t) => s + (enPregunta.has(t) ? idf(t) : 0), 0) / e.pesoTotal : 0;
        const p = Math.max(parecido, PESO_CONTIENE * contiene);
        const previo = mejores.get(e.intencion);
        if (!previo || p > previo.p || (p === previo.p && parecido > previo.parecido)) mejores.set(e.intencion, { p, parecido });
      });
      return [...mejores].map(([intencion, x]) => ({ intencion, ...x }))
        .sort((a, b) => b.p - a.p || b.parecido - a.parecido);
    }

    // ---------- cifras para las plantillas

    const tipoEleccion = (a) => (atlas.presidenciales.includes(Number(a)) ? T.presidencial : T.intermedia);
    const lugarTexto = (e) => (e ? T.enEstado(e.nombre) : T.enPais);
    const fuente = (e) => e || atlas.nacional;
    function frente(dif, otro) {
      return Math.abs(dif) < 0.05 ? T.igualQue(otro) : T.puntosQue(puntos(dif), dif > 0, otro);
    }

    function datosDe(i, d) {
      const a = String(d.anio);
      const e = d.estado ? porClave[d.estado] : null;
      switch (i.tipo) {
        case "metodo": return { metodo: mitos.nota_metodo };
        case "proxima": return { fecha: mitos.proxima_eleccion.fecha, tipo: T.tipoEleccion(mitos.proxima_eleccion.tipo) };
        case "pais": return { anio: a, tipo: tipoEleccion(a), pct: pct(atlas.nacional.participacion[a]) };
        case "estado": {
          const v = e.participacion[a], n = atlas.nacional.participacion[a];
          return { estado: e.nombre, anio: a, tipo: tipoEleccion(a), pct: pct(v), pais: pct(n), comparacion: frente(v - n, ""), lugar: e.lugar[a] };
        }
        case "extremo": {
          const orden = atlas.estados.filter((x) => x.participacion[a] != null)
            .sort((x, y) => y.participacion[a] - x.participacion[a]);
          const [uno, otro] = i.orden === "mas" ? [orden[0], orden.at(-1)] : [orden.at(-1), orden[0]];
          return { anio: a, estado: uno.nombre, pct: pct(uno.participacion[a]), otro: otro.nombre, pct_otro: pct(otro.participacion[a]),
            diferencia: puntos(orden[0].participacion[a] - orden.at(-1).participacion[a]) };
        }
        case "comparar": {
          const o = porClave[d.otro];
          const dif = e.participacion[a] - o.participacion[a];
          return { anio: a, estado: e.nombre, pct: pct(e.participacion[a]), otro: o.nombre, pct_otro: pct(o.participacion[a]),
            comparacion: Math.abs(dif) < 0.05 ? T.votaronIgual : T.votoMas(dif > 0 ? e.nombre : o.nombre, puntos(dif)) };
        }
        case "edad": {
          const valores = fuente(e).detalle[a].edad;
          const grupos = atlas.grupos_edad.map((g, k) => ({ g, v: valores[k] })).filter((x) => x.v != null);
          const max = grupos.reduce((x, y) => (y.v > x.v ? y : x));
          const min = grupos.reduce((x, y) => (y.v < x.v ? y : x));
          return { lugar_texto: lugarTexto(e), anio: a, lista: atlas.grupos_edad.map((g, k) => `${g}: ${pct(valores[k])}`).join("; "),
            grupo_max: max.g, pct_max: pct(max.v), grupo_min: min.g, pct_min: pct(min.v) };
        }
        case "sexo": {
          const [m, h] = fuente(e).detalle[a].sexo;
          const dif = m - h;
          return { lugar_texto: lugarTexto(e), anio: a, mujeres: pct(m), hombres: pct(h),
            comparacion: Math.abs(dif) < 0.05 ? T.votaronIgual : T.votaronMas(dif > 0 ? T.lasMujeres : T.losHombres, puntos(dif)) };
        }
        case "seccion": {
          const valores = fuente(e).detalle[a].seccion;
          const [u, m, r] = valores;
          const k = valores.indexOf(Math.max(...valores.filter((v) => v != null)));
          return { lugar_texto: lugarTexto(e), anio: a, urbana: pct(u), mixta: pct(m), rural: pct(r), mayor: T.secciones[k] };
        }
        case "entre_anios": {
          const [a1, a2] = d.anios;
          const v1 = fuente(e).participacion[a1], v2 = fuente(e).participacion[a2];
          const dif = v2 - v1;
          return { lugar_texto: lugarTexto(e), anio1: a1, anio2: a2, pct1: pct(v1), pct2: pct(v2),
            cambio: Math.abs(dif) < 0.05 ? T.igual : dif > 0 ? T.subio(puntos(dif)) : T.bajo(puntos(dif)) };
        }
        case "historia": return { lugar_texto: lugarTexto(e),
          lista: atlas.anios.map((x) => `${x} (${tipoEleccion(x)}): ${pct(fuente(e).participacion[x])}`).join("; ") };
        case "tipos": {
          const lista = (filtro) => atlas.anios.filter(filtro).map((x) => `${x}, ${pct(atlas.nacional.participacion[x])}`).join("; ");
          return { presidenciales: lista((x) => atlas.presidenciales.includes(x)), intermedias: lista((x) => !atlas.presidenciales.includes(x)) };
        }
        case "region": return { anio: a,
          lista: atlas.regiones.slice().sort((x, y) => y.participacion[a] - x.participacion[a])
            .map((r) => `${r.nombre}, ${pct(r.participacion[a])}`).join("; ") };
        case "mito": {
          const m = listaMitos.find((x) => x.id === i.mito);
          return { enunciado: m.enunciado.replace(/\.$/, ""), veredicto: textos.veredictos[m.veredicto].toLowerCase(), resumen: m.resumen };
        }
        default: return {};
      }
    }

    const llenar = (plantilla, valores) => {
      const t = plantilla.replace(/\{(\w+)\}/g, (_, k) => String(valores[k] ?? ""));
      return t.charAt(0).toUpperCase() + t.slice(1);
    };

    function sugerir(ranking) {
      const ids = ranking.filter((r) => r.p > 0.12 && r.intencion.sugerencia).slice(0, 3).map((r) => r.intencion.id);
      chat.sugerencias_inicio.forEach((id) => { if (ids.length < 3 && !ids.includes(id)) ids.push(id); });
      return ids.map((id) => porId[id].sugerencia);
    }

    // ---------- responder

    function nuevoContexto(estadoInicial = null) {
      return { estado: estadoInicial, otro: null, anio: null, ultima: null, pendiente: null };
    }

    // «¿Qué edad vota más y cómo se compara entre hombres y mujeres?» → dos partes, cada una con su respuesta.
    const SEPARADOR = /\s+y\s+(?=(?:como|cuanto|cuanta|cuantos|cuantas|que|quien|quienes|donde|cuando|cual|cuales)\b)/;
    function partes(texto) {
      return texto.split(/[?;]+/).map(normal).filter(Boolean).flatMap((p) => p.split(SEPARADOR)).filter(Boolean);
    }

    function responder(texto, ctx) {
      const lista = partes(texto);
      if (lista.length <= 1) return responderUna(texto, ctx);
      const respuestas = lista.map((p) => responderUna(p, ctx));
      const buenas = respuestas.filter((r) => r.intencion && !r.falta);
      if (!buenas.length) return respuestas[0];
      return { texto: buenas.map((r) => r.texto).join(" "), intencion: buenas.map((r) => r.intencion).join("+"),
        puntaje: Math.min(...buenas.map((r) => r.puntaje || 0)) };
    }

    function responderUna(texto, ctx) {
      const tokens = normal(texto).split(" ").filter(Boolean);
      if (!tokens.length) return { texto: T.vacio, sugerencias: sugerir([]) };
      const { salida, estados, anios } = extraer(tokens);
      const terms = terminos(salida);
      const contenido = terms.filter((t) => !t.startsWith("_"));
      // «pais» funciona como dato (quita el estado), no como tema: «¿y en todo el país?» sigue la conversación.
      const conPais = contenido.includes("pais");
      const tema = contenido.filter((t) => t !== "pais");
      const ranking = puntuar(terms);
      const mejor = ranking[0] || { p: 0 };

      const anioPedido = anios.at(-1);
      if (anioPedido && !atlas.anios.includes(anioPedido)) {
        return { texto: T.anioSinDatos(atlas.anios.join(", "), mitos.proxima_eleccion.fecha), intencion: "anio_sin_datos" };
      }
      // Hablar del país quita el estado del contexto.
      if (conPais && !estados.length) { ctx.estado = null; ctx.otro = null; }

      // ¿Qué intención? Primero, completar lo que se pidió; luego, seguir la conversación («¿y en 2021?»).
      let intencion = null;
      const hayDatos = estados.length || anios.length || conPais;
      const soloDatos = hayDatos && (tema.length === 0 || mejor.p < UMBRAL);
      if (ctx.pendiente && soloDatos && (estados.length || anios.length)) intencion = porId[ctx.pendiente];
      else if (soloDatos && tema.length === 0) {
        const previa = ctx.ultima && porId[ctx.ultima];
        const sirve = previa && !["fijo", "mito", "metodo", "proxima", "tipos"].includes(previa.tipo);
        intencion = sirve ? previa : porId[estados.length ? "estado" : ctx.estado ? "estado" : "pais"];
      } else if (mejor.p >= UMBRAL) intencion = mejor.intencion;
      ctx.pendiente = null;
      // Dos años en la pregunta («Colima, 2018 contra 2024»): se comparan entre sí.
      const anioUnicos = [...new Set(anios)].sort();
      if (anioUnicos.length >= 2 && (!intencion || ["pais", "estado", "historia", "entre_anios"].includes(intencion.tipo))) {
        intencion = porId.entre_anios;
      }

      if (!intencion) {
        return { texto: T.noSe, sugerencias: sugerir(ranking), intencion: null, puntaje: mejor.p };
      }

      // Datos: lo que dijo la persona, luego el contexto, luego lo de por omisión.
      const usa = new Set([...(intencion.requiere || []), ...(intencion.usa || [])]);
      const d = { anio: anioPedido || ctx.anio || atlas.ultimo, anios: anioUnicos.slice(0, 2), estado: null, otro: null };
      if (usa.has("otro")) {
        if (estados.length >= 2) [d.estado, d.otro] = estados;
        else if (!estados.length && ctx.estado && ctx.otro) [d.estado, d.otro] = [ctx.estado, ctx.otro];
        else if (estados.length === 1 && ctx.estado && ctx.estado !== estados[0]) [d.estado, d.otro] = [ctx.estado, estados[0]];
        else [d.estado] = estados.length ? estados : [ctx.estado];
      } else if (usa.has("estado")) {
        d.estado = estados[0] || ctx.estado;
      }
      const falta = (intencion.requiere || []).find((k) => !d[k]);
      if (falta) {
        ctx.pendiente = intencion.id;
        if (d.estado) ctx.estado = d.estado;
        return { texto: T.pedir[falta], intencion: intencion.id, falta };
      }

      if (anioPedido) ctx.anio = anioPedido;
      if (d.estado && usa.has("estado")) ctx.estado = d.estado;
      ctx.otro = d.otro;
      ctx.ultima = intencion.id;
      return { texto: llenar(intencion.respuesta, datosDe(intencion, d)), intencion: intencion.id, puntaje: mejor.p };
    }

    function inicio() {
      return { texto: T.bienvenida, sugerencias: chat.sugerencias_inicio.map((id) => porId[id].sugerencia) };
    }

    return { responder, nuevoContexto, inicio };
  }

  return { crear, normal };
})();
