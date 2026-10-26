/*
 * «Y en tu caso…»: el dato del mito para el estado o la edad de la persona.
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

    intermedias(m, ctx, d) {
      const t = T();
      const { local } = ctx.perfil;
      const anios = local.anios;
      return {
        texto: `${apertura(d.relacion, ctx.lugar)} ${t.intermedias(d, pct)}`,
        grafica: {
          tipo: "columnas", titulo: t.tituloElecciones(ctx.lugar),
          x: anios.map(String),
          series: [{
            nombre: TEXTOS.graficas.participacion,
            valores: anios.map((a) => local.total[a]),
            colores: m.grafica.series[0].colores, // mismos años y tipos que la gráfica nacional
          }],
          leyenda: [{ nombre: t.presidencial, color: "datos" }, { nombre: t.intermedia, color: "base" }],
        },
        anio: `${anios[0]}–${anios.at(-1)}`,
      };
    },

    tendencia(m, ctx, d) {
      const t = T();
      return {
        texto: `${apertura(d.relacion, ctx.lugar)} ${t.tendencia(d, pct)}`,
        grafica: {
          tipo: "columnas", titulo: t.tituloIntermedias(ctx.lugar),
          x: d.intermedias.map((x) => String(x[0])),
          series: [{ nombre: TEXTOS.graficas.participacion, valores: d.intermedias.map((x) => x[1]), color: "datos" }],
        },
        anio: d.intermedias.map((x) => x[0]).join(", "),
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
    if (!d && !(POR_EDAD.has(m.id) && perfil.edad != null)) return null;
    const lugar = conEstado ? perfil.nombre : (perfil.nombre || P().pais);
    const r = armador(m, { ...ctx, lugar }, d);
    return { texto: r.texto, grafica: r.grafica, fuente: fuente(r.anio), lugar };
  }

  return { armar };
})();
