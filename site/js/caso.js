/*
 * «Y en tu caso…»: el dato del mito para el estado, el municipio o la edad de la persona.
 * La comparación con el veredicto (coincide, empate o contrario) la calcula scripts/procesar.py;
 * aquí solo se elige la plantilla de textos.js. El sello del veredicto nunca cambia.
 */
const EnTuCaso = (() => {
  const T = () => TEXTOS.enTuCaso;
  const P = () => TEXTOS.perfil;
  const pct = (v) => `${v.toFixed(1)}%`;
  const fuente = (anio) => TEXTOS.perfil.fuente(anio);

  // Cada texto empieza diciendo si el estado se parece al país.
  function apertura(rel, lugar) {
    const t = T();
    if (rel === "coincide") return t.igual(lugar);
    if (rel === "empate") return t.empate(lugar);
    return t.distinto(lugar);
  }

  // Edad que la persona tenía en la elección de referencia (igual que en «Tu historia como votante»).
  function edadEnEleccion(ctx, anio) {
    const { edad } = ctx.perfil;
    return edad == null ? null : Personal.edadEn(edad, Number(anio));
  }

  // Participación de la edad de la persona en esa elección (con respaldo por umbral) y su frase.
  function fraseEdad(ctx, anio) {
    const { local, pais, nombre } = ctx.perfil;
    const edad = edadEnEleccion(ctx, anio);
    if (edad == null) return null;
    const res = Personal.participacionEdad(local, pais, anio, edad);
    const lugar = res.nivel === "pais" ? P().pais : (nombre || P().pais);
    const quien = P().quien(res);
    const texto = edad < 18
      ? T().cuandoCumplas(lugar, Math.round(res.valor), anio)
      : T().tuEdad(edad, lugar, Math.round(res.valor), quien, anio);
    return { res, lugar, quien, edad, texto: texto + P().nota(res, nombre || P().pais) };
  }

  function grupoDeEdad(p, edad) {
    return p.grupos[Personal.indiceGrupo(p, Math.max(edad, 18))];
  }

  // Municipio de la persona en los mitos que responde su participación total (intermedias y tendencia).
  // Devuelve { texto, valido } o null si no eligió municipio.
  function fraseMunicipio(m, ctx, armarTexto) {
    const mun = ctx.perfil.municipio;
    if (!mun || !mun.en_tu_caso || !mun.en_tu_caso[m.id]) return null;
    const t = T();
    const d = mun.en_tu_caso[m.id];
    if (d.relacion === "sin_datos") {
      return { texto: d.motivo === "faltan" ? t.municipioFaltan(mun.nombre) : t.municipioUmbral(mun.nombre, mun.umbral), valido: false };
    }
    const abre = { coincide: t.municipioIgual, empate: t.municipioEmpate, contrario: t.municipioDistinto }[d.relacion];
    return { texto: `${abre(mun.nombre)} ${armarTexto(d)}`, valido: true };
  }

  // Columnas del municipio junto a las del estado; el tipo de elección va en la etiqueta del año.
  function graficaConMunicipio(titulo, anios, local, mun, tipo) {
    return {
      tipo: "columnas", titulo,
      x: anios.map((a) => (tipo ? T().anioTipo(a, tipo(a)) : String(a))),
      series: [
        { nombre: mun.nombre, valores: anios.map((a) => mun.participacion[a]), color: "datos" },
        { nombre: local.nombre, valores: anios.map((a) => local.total[a]), color: "base" },
      ],
    };
  }

  const armadores = {
    sexo(m, ctx, d) {
      const t = T();
      return {
        texto: `${apertura(d.relacion, ctx.lugar)} ${t.sexo(d.mujeres, d.hombres, d.anio, pct)}`,
        grafica: {
          tipo: "barras", titulo: t.tituloSexo(ctx.lugar, d.anio),
          items: [
            { etiqueta: t.mujeres, valor: d.mujeres, color: "datos" },
            { etiqueta: t.hombres, valor: d.hombres, color: "base" },
          ],
        },
        anio: d.anio,
      };
    },

    campo(m, ctx, d) {
      const t = T();
      if (d.relacion === "sin_datos") return { texto: t.campoSinDatos(ctx.lugar), grafica: null, anio: d.anio };
      return {
        texto: `${apertura(d.relacion, ctx.lugar)} ${t.campo(d, pct)}`,
        grafica: {
          tipo: "barras", titulo: t.tituloCampo(ctx.lugar, d.anio),
          items: [
            { etiqueta: t.rural, valor: d.rural, color: "datos" },
            { etiqueta: t.urbana, valor: d.urbana, color: "base" },
          ],
        },
        anio: d.anio,
      };
    },

    // En intermedias y tendencia, d (estado) puede faltar si solo aporta el municipio (edición del mismo estado).
    intermedias(m, ctx, d) {
      const t = T();
      const { local, municipio } = ctx.perfil;
      const anios = local.anios;
      const partes = d ? [`${apertura(d.relacion, ctx.lugar)} ${t.intermedias(d, pct)}`] : [];
      const mun = fraseMunicipio(m, ctx, (x) => t.intermedias(x, pct));
      if (mun) partes.push(mun.texto);
      // El color de cada columna dice si fue presidencial o intermedia (mismo orden que la gráfica nacional).
      const colores = m.grafica.series[0].colores;
      const tipo = (a) => (colores[anios.indexOf(a)] === "datos" ? t.presidencial : t.intermedia);
      return {
        texto: partes.join(" "),
        grafica: mun && mun.valido
          ? graficaConMunicipio(t.tituloEleccionesMunicipio(municipio.nombre, ctx.lugar), anios, local, municipio, tipo)
          : {
            tipo: "columnas", titulo: t.tituloElecciones(ctx.lugar),
            x: anios.map(String),
            series: [{
              nombre: TEXTOS.graficas.participacion,
              valores: anios.map((a) => local.total[a]),
              colores,
            }],
            leyenda: [{ nombre: t.presidencial, color: "datos" }, { nombre: t.intermedia, color: "base" }],
          },
        anio: `${anios[0]}–${anios.at(-1)}`,
      };
    },

    tendencia(m, ctx, d) {
      const t = T();
      const { local, municipio } = ctx.perfil;
      const anios = m.grafica.x.map(Number); // las intermedias, igual que la gráfica nacional
      const partes = d ? [`${apertura(d.relacion, ctx.lugar)} ${t.tendencia(d, pct)}`] : [];
      const mun = fraseMunicipio(m, ctx, (x) => t.tendencia(x, pct));
      if (mun) partes.push(mun.texto);
      return {
        texto: partes.join(" "),
        grafica: mun && mun.valido
          ? graficaConMunicipio(t.tituloIntermediasMunicipio(municipio.nombre, ctx.lugar), anios, local, municipio)
          : {
            tipo: "columnas", titulo: t.tituloIntermedias(ctx.lugar),
            x: anios.map(String),
            series: [{ nombre: TEXTOS.graficas.participacion, valores: anios.map((a) => local.total[a]), color: "datos" }],
          },
        anio: anios.join(", "),
      };
    },

    "primer-voto"(m, ctx, d) {
      const t = T();
      const anio = d ? d.anio : ctx.anio;
      const datos = ctx.perfil.local;
      const v18 = datos.estimar[anio]["18"];
      const prom = datos.total[anio];
      const partes = [];
      if (d) partes.push(`${apertura(d.relacion, ctx.lugar)} ${t.primerVoto(d, v18, prom, ctx.lugar, pct)}`);
      const e = fraseEdad(ctx, anio);
      // Si en esa elección aún no tenía 18, el dato de 18 años ya está en la frase del estado.
      if (e && !(d && e.edad < 18)) partes.push(e.texto);
      const items = [{ etiqueta: t.a18(ctx.lugar), valor: v18, color: "datos" }];
      if (e && e.edad >= 19) items.push({ etiqueta: t.aTuEdad(e.quien, e.lugar), valor: e.res.valor, color: "acento" });
      items.push({ etiqueta: t.promedio(ctx.lugar), valor: prom, color: "base" });
      return { texto: partes.join(" "), grafica: { tipo: "barras", titulo: t.tituloEdad(ctx.lugar, anio), items }, anio };
    },

    jovenes(m, ctx, d) {
      const t = T();
      const anio = d ? d.anio : ctx.anio;
      const datos = ctx.perfil.local;
      const j = datos.estimar[anio]["18_29"];
      const partes = [];
      if (d) partes.push(`${apertura(d.relacion, ctx.lugar)} ${t.jovenes(d, j, anio, pct)}`);
      const e = fraseEdad(ctx, anio);
      if (e) partes.push(e.texto);
      const valor = e ? e.res.valor : j;
      const quien = e ? e.quien : t.jovenesQuien;
      const lugar = e ? e.lugar : ctx.lugar;
      return {
        texto: partes.join(" "),
        grafica: { tipo: "unidades", titulo: t.tituloUnidades(quien, lugar, anio), valor, etiqueta: quien },
        anio,
      };
    },

    sesentas(m, ctx, d) {
      const t = T();
      const anio = d ? d.anio : ctx.anio;
      const datos = ctx.perfil.local;
      const valorDe = (g) => datos.por_grupo[anio][datos.grupos.indexOf(g)];
      const partes = [];
      const etiquetas = [];
      if (d) {
        partes.push(`${apertura(d.relacion, ctx.lugar)} ${t.sesentas(d, pct)}`);
        etiquetas.push(d.grupo);
      }
      etiquetas.push(...t.gruposSesentas);
      const edad = edadEnEleccion(ctx, anio);
      if (edad != null) {
        const g = grupoDeEdad(datos, edad);
        partes.push(t.tuGrupo(g, valorDe(g), ctx.lugar, anio, pct));
        etiquetas.push(g);
      }
      const unicos = [...new Set(etiquetas)];
      return {
        texto: partes.join(" "),
        grafica: {
          tipo: "barras", titulo: t.tituloGrupos(ctx.lugar, anio),
          items: unicos.map((g) => ({ etiqueta: t.anios(g), valor: valorDe(g), color: t.gruposSesentas.includes(g) ? "datos" : "base" })),
        },
        anio,
      };
    },

    mayores(m, ctx, d) {
      const t = T();
      const anio = d ? d.anio : ctx.anio;
      const datos = ctx.perfil.local;
      const valorDe = (g) => datos.por_grupo[anio][datos.grupos.indexOf(g)];
      const ultimo = datos.grupos.at(-1);
      const partes = [];
      const etiquetas = [];
      if (d) {
        partes.push(`${apertura(d.relacion, ctx.lugar)} ${t.mayores(d, pct)}`);
        etiquetas.push(d.grupo);
      }
      etiquetas.push(ultimo);
      const edad = edadEnEleccion(ctx, anio);
      if (edad != null) {
        const g = grupoDeEdad(datos, edad);
        partes.push(t.tuGrupo(g, valorDe(g), ctx.lugar, anio, pct));
        etiquetas.push(g);
      }
      const unicos = [...new Set(etiquetas)];
      return {
        texto: partes.join(" "),
        grafica: {
          tipo: "barras", titulo: t.tituloGrupos(ctx.lugar, anio),
          items: unicos.map((g) => ({ etiqueta: t.anios(g), valor: valorDe(g), color: g === ultimo ? "acento" : "base" })),
        },
        anio,
      };
    },
  };

  // Mitos que dependen de la edad: se muestran aunque la persona no haya dicho su estado.
  const POR_EDAD = new Set(["primer-voto", "jovenes", "sesentas", "mayores"]);
  // Mitos que responde la participación total del municipio (municipios.json).
  const POR_MUNICIPIO = new Set(["intermedias", "tendencia"]);

  /*
   * Devuelve { texto, grafica, fuente, lugar } o null si no aplica.
   * ctx: { perfil, ambito (nombre del ámbito del juego), ambitoClave, anio }
   */
  function armar(m, ctx) {
    const { perfil } = ctx;
    if (!perfil || (perfil.edad == null && perfil.entidad == null)) return null;
    const armador = armadores[m.id];
    if (!armador) return null;
    // El estado de la persona aporta algo solo si es distinto del ámbito del juego.
    const conEstado = perfil.entidad != null && perfil.entidad !== ctx.ambitoClave && perfil.local.en_tu_caso;
    const d = conEstado ? perfil.local.en_tu_caso[m.id] : null;
    // El municipio aporta aunque su estado sea el del juego.
    const conMunicipio = POR_MUNICIPIO.has(m.id) && perfil.municipio && perfil.municipio.en_tu_caso;
    if (!d && !conMunicipio && !(POR_EDAD.has(m.id) && perfil.edad != null)) return null;
    const lugar = conEstado ? perfil.nombre : (perfil.nombre || P().pais);
    const r = armador(m, { ...ctx, lugar }, d);
    // Nombre del botón del selector: el municipio si es lo único que aporta.
    const etiqueta = !d && conMunicipio ? perfil.municipio.nombre : lugar;
    return { texto: r.texto, grafica: r.grafica, fuente: fuente(r.anio), lugar: etiqueta };
  }

  return { armar };
})();
