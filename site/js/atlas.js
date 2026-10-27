/*
 * Pestaña «Recorrido por regiones» del mapa: recorrido con el mapa fijo (scrollytelling)
 * y comparación de tu estado. Los datos se cargan una vez (Atlas.datos) y los comparte «Explorar».
 * El estado elegido vive solo en memoria: no se guarda ni va en la URL.
 */
const Atlas = (() => {
  const $ = (s) => document.querySelector(s);
  const T = TEXTOS.atlas;
  let atlas, geo, porClave, presidencial, observador, carga, mapa, cortes, armado = false;
  const estado = { clave: null, anio: null, paso: null };
  const PASOS = {};

  function tablaEstados(filas, anio) {
    const d = document.createElement("details");
    d.className = "g-tabla";
    d.innerHTML = `<summary>${T.pasos.tablaEstados}</summary>`;
    const caja = document.createElement("div");
    GraficasAtlas.tabla(caja, [T.pasos.colEstado, T.pasos.colVoto(anio)], filas.map(([n, v]) => [n, T.pct(v)]));
    d.appendChild(caja);
    return d;
  }

  function seccion(id, { ante, titulo, textos, tabla }) {
    const s = document.createElement("section");
    s.className = "at-paso";
    s.dataset.paso = id;
    s.setAttribute("aria-labelledby", `a-t-${id}`);
    if (ante) s.insertAdjacentHTML("beforeend", `<p class="at-antetitulo"></p>`);
    s.insertAdjacentHTML("beforeend", `<h3 id="a-t-${id}"></h3>`);
    if (ante) s.querySelector(".at-antetitulo").textContent = ante;
    s.querySelector("h3").textContent = titulo;
    textos.filter(Boolean).forEach((t, i) => {
      const p = document.createElement("p");
      p.className = i === 0 ? "at-texto" : "at-extra";
      p.textContent = t;
      s.appendChild(p);
    });
    s.appendChild(botonEscuchar());
    if (tabla) s.appendChild(tabla);
    return s;
  }

  // ---------- pasos de la historia

  function armarPasos() {
    PASOS.portada = { anio: atlas.ultimo, titulo: T.mapa.tituloPais };
    const contenedor = $("#a-pasos-generados");
    const ordenados = (anio) => atlas.estados
      .map((e) => [e.nombre, e.participacion[anio]])
      .sort((a, b) => b[1] - a[1]);

    atlas.apertura.forEach((p) => {
      PASOS[p.id] = { anio: p.anio, titulo: T.mapa.tituloPais, resaltar: p.resaltar, etiquetas: p.resaltar };
      contenedor.appendChild(seccion(p.id, {
        titulo: p.titulo, textos: [p.texto],
        tabla: p.id === "extremos" ? null : tablaEstados(ordenados(p.anio), p.anio),
      }));
    });

    PASOS.regiones = { anio: atlas.ultimo, titulo: T.mapa.tituloPais, regiones: true };
    contenedor.appendChild(seccion("regiones", { titulo: T.pasos.regionesTitulo, textos: [T.pasos.regionesTexto] }));

    atlas.regiones.forEach((r, i) => {
      PASOS[r.id] = { anio: atlas.ultimo, titulo: T.mapa.tituloRegion(r.nombre), region: r.id, etiquetas: r.estados };
      contenedor.appendChild(seccion(r.id, {
        ante: `${T.pasos.regionEtiqueta(i + 1, atlas.regiones.length)} · ${r.nombre}`,
        titulo: r.titulo, textos: [r.texto, r.extra], tabla: tablaEstados(r.tabla, atlas.ultimo),
      }));
    });

    PASOS.final = { final: true };
  }

  function activar(id) {
    if (estado.paso === id) return;
    estado.paso = id;
    document.querySelectorAll(".at-paso").forEach((s) => s.classList.toggle("at-activo", s.dataset.paso === id));
    pintarMapa();
  }

  function pintarMapa() {
    let p = PASOS[estado.paso] || PASOS.portada;
    if (p.final) {
      const e = porClave[estado.clave];
      p = e ? { anio: estado.anio, titulo: T.mapa.tituloEstado(e.nombre), estado: e.clave, etiquetas: [e.clave] }
        : { anio: estado.anio, titulo: T.mapa.tituloPais };
    }
    const filas = mapa.pintar({ ...p, cortes });
    $("#a-mapa-titulo").textContent = p.titulo;
    $("#a-mapa-anio").textContent = T.mapa.anio(p.anio, presidencial(p.anio));
    $("#a-mapa-desc").textContent = T.mapa.desc(p.titulo, p.anio, T.mapa.listaEstados(filas));
  }

  // El paso activo es el que cruza la línea de lectura (más abajo en el celular, donde el mapa va arriba).
  function observar() {
    if (observador) observador.disconnect();
    const celular = matchMedia("(max-width: 52rem)").matches;
    observador = new IntersectionObserver((entradas) => {
      entradas.filter((e) => e.isIntersecting).forEach((e) => activar(e.target.dataset.paso));
    }, { rootMargin: celular ? "-62% 0px -37% 0px" : "-48% 0px -51% 0px" });
    document.querySelectorAll(".at-paso").forEach((s) => observador.observe(s));
  }

  // ---------- tu estado

  function armarComparacion() {
    const selectores = [$("#a-elige-estado"), $("#a-elige-estado-2")];
    const nombres = atlas.estados.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    selectores.forEach((s) => {
      nombres.forEach((e) => s.add(new Option(e.nombre, e.clave)));
      s.addEventListener("change", () => elegir(Number(s.value) || null));
    });
    mapa.alElegir((clave) => { if (estado.paso === "final") elegir(clave); });
    // Botones en lugar de enlaces con #: así la URL no cambia.
    document.querySelectorAll("[data-a-compara]").forEach((b) => b.addEventListener("click", () => {
      const destino = $("#a-compara");
      destino.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      destino.focus({ preventScroll: true });
    }));

    $("#a-anios").replaceChildren(...atlas.anios.map((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "at-anio-btn";
      b.textContent = a;
      b.setAttribute("aria-pressed", String(String(a) === estado.anio));
      b.addEventListener("click", () => {
        estado.anio = String(a);
        document.querySelectorAll(".at-anio-btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        pintarComparacion();
        if (estado.paso === "final") pintarMapa();
      });
      return b;
    }));
  }

  function elegir(clave) {
    estado.clave = clave;
    [$("#a-elige-estado"), $("#a-elige-estado-2")].forEach((s) => { s.value = clave || ""; });
    const e = porClave[clave];
    const resumen = $("#a-final-resumen");
    resumen.hidden = !e;
    $("#a-ir-compara").hidden = !e;
    if (e) {
      const a = atlas.ultimo;
      resumen.textContent = T.compara.frase(e.nombre, a, e.participacion[a] - atlas.nacional.participacion[a], e.lugar[a]);
    }
    if (estado.paso === "final") pintarMapa();
    pintarComparacion();
  }

  function pintarComparacion() {
    const e = porClave[estado.clave];
    $("#a-compara-cuerpo").hidden = !e;
    $("#a-compara-vacio").hidden = !!e;
    if (!e) return;
    const a = estado.anio;
    const N = atlas.nacional;
    const ve = e.participacion[a], vn = N.participacion[a];
    $("#a-c-estado-valor").textContent = T.pct(ve);
    $("#a-c-estado-nombre").textContent = T.compara.votoEn(e.nombre, a);
    $("#a-c-nac-valor").textContent = T.pct(vn);
    $("#a-c-frase").textContent = T.compara.frase(e.nombre, a, ve - vn, e.lugar[a]);

    const serieE = atlas.anios.map((x) => e.participacion[x]);
    const serieN = atlas.anios.map((x) => N.participacion[x]);
    $("#a-g1-t").textContent = T.compara.tituloHistoria(atlas.anios[0], atlas.anios.at(-1));
    GraficasAtlas.historia($("#a-g-historia"), { anios: atlas.anios, estado: serieE, pais: serieN, nombre: e.nombre, anioActivo: a });
    GraficasAtlas.tabla($("#a-t-historia"), [T.compara.colAnio, e.nombre, T.compara.nacional],
      atlas.anios.map((x, i) => [x, T.pct(serieE[i]), T.pct(serieN[i])]));

    const de = e.detalle[a], dn = N.detalle[a];
    const bloques = [
      ["edad", atlas.grupos_edad, T.compara.tituloEdad(a)],
      ["sexo", atlas.sexos, T.compara.tituloSexo(a)],
      ["seccion", atlas.secciones, T.compara.tituloSeccion(a)],
    ];
    // Las categorías son claves (las usan los filtros); se muestran con su nombre en la lengua de la página.
    const nombreDe = (k, c) => (TEXTOS.explorar.grupos[k] || {})[c] || c;
    bloques.forEach(([k, cats, titulo], i) => {
      const nombres = cats.map((c) => nombreDe(k, c));
      $(`#a-g${i + 2}-t`).textContent = titulo;
      GraficasAtlas.pares($(`#a-g-${k}`), { categorias: nombres, estado: de[k], pais: dn[k], nombre: e.nombre });
      GraficasAtlas.tabla($(`#a-t-${k}`), [T.compara.colGrupo, e.nombre, T.compara.nacional],
        nombres.map((c, j) => [c, T.pct(de[k][j]), T.pct(dn[k][j])]));
    });

    // La mayor diferencia por edad, calculada con los mismos datos de la gráfica.
    let mayor = null;
    atlas.grupos_edad.forEach((g, j) => {
      if (de.edad[j] == null || dn.edad[j] == null) return;
      const dif = de.edad[j] - dn.edad[j];
      if (!mayor || Math.abs(dif) > Math.abs(mayor.dif)) mayor = { g, dif };
    });
    $("#a-g-edad-frase").textContent = mayor ? T.compara.fraseEdad(e.nombre, mayor.g, mayor.dif) : "";
  }

  // ---------- carga

  // El mapa queda fijo bajo la barra del juego, que cambia de alto con la letra.
  function ajustarEncabezado() {
    const alto = document.querySelector(".barra").offsetHeight;
    document.documentElement.style.setProperty("--at-encabezado", `${alto}px`);
  }

  // Datos del atlas y del mapa: una sola descarga para las dos pestañas.
  function datos() {
    if (!carga) {
      carga = Promise.all([
        fetch("data/atlas.json").then((r) => r.json()),
        fetch("data/mapa.json").then((r) => r.json()),
      ]).then(([a, g]) => {
        atlas = Lengua.atlas(a);
        geo = g;
        porClave = Object.fromEntries(atlas.estados.map((e) => [e.clave, e]));
        presidencial = (x) => atlas.presidenciales.includes(Number(x));
        estado.anio = String(atlas.ultimo);
        return { atlas, geo };
      }).catch((err) => {
        carga = null;
        throw err;
      });
    }
    return carga;
  }

  function armar() {
    if (armado) return;
    armado = true;
    mapa = Mapa.crear($("#a-mapa"), geo, atlas);
    cortes = Mapa.escala(atlas.estados.flatMap((e) => atlas.anios.map((a) => e.participacion[a])));
    Mapa.leyenda($("#a-leyenda"), cortes, false);
    $("#a-fuente").textContent = `${atlas.metodo} ${geo.fuente}`;
    $(".at-paso-portada").appendChild(botonEscuchar());
    $("#a-elige-estado").before(botonEscuchar());

    armarPasos();
    armarComparacion();
    matchMedia("(max-width: 52rem)").addEventListener("change", observar);
    let espera;
    addEventListener("resize", () => {
      clearTimeout(espera);
      espera = setTimeout(redibujar, 200);
    });
  }

  // «Escuchar» en cada paso: lee su título y sus textos (también los de su tabla no, que es larga).
  function textoPaso(s) {
    return [...s.querySelectorAll(".at-antetitulo, h3, p:not(.at-pista)")]
      .filter((n) => !n.hidden).map((n) => n.textContent.trim()).filter(Boolean).join(". ");
  }

  function botonEscuchar() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "escuchar escuchar-paso";
    b.hidden = !Voz.soportada;
    b.innerHTML = `<svg class="voz-icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="onda" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>${T.escuchar}</span>`;
    b.addEventListener("click", () => Voz.alternar(textoPaso(b.closest(".at-paso")), b));
    return b;
  }

  // Lo que se lee al activar «Leer en voz alta» con el recorrido abierto: el paso activo.
  function textoActivo() {
    const s = document.querySelector(".at-paso.at-activo") || document.querySelector(".at-paso-portada");
    return s ? textoPaso(s) : "";
  }

  // Desde «Explorar»: abre la comparación con ese estado ya elegido.
  function verEstado(clave) {
    elegir(clave);
    const destino = $("#a-compara");
    destino.scrollIntoView({ behavior: "auto" });
    destino.focus({ preventScroll: true });
  }

  // Se llama cada vez que la pestaña se muestra (el mapa necesita estar visible para medir sus etiquetas).
  async function abrir() {
    try {
      await datos();
    } catch {
      $("#a-mapa-titulo").textContent = T.error;
      return;
    }
    armar();
    ajustarEncabezado();
    observar();
    const paso = estado.paso || "portada";
    estado.paso = null;
    activar(paso);
  }

  function cerrar() {
    if (observador) observador.disconnect();
  }

  // Al cambiar el tamaño de la ventana o de la letra: etiquetas del mapa y gráficas de la comparación.
  function redibujar() {
    if (!armado || $("#panel-recorrido").hidden || $("#mapa").hidden) return;
    ajustarEncabezado();
    pintarMapa();
    pintarComparacion();
  }

  return { datos, geo: () => geo, abrir, cerrar, redibujar, verEstado, textoActivo };
})();
