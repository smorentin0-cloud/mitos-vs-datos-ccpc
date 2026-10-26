/*
 * Versión imprimible: arma una tarjeta por mito (frente: la frase; reverso: la respuesta y la gráfica).
 * Las gráficas se dibujan una sola vez, sin animación, con los mismos componentes del juego.
 */
(() => {
  const T = TEXTOS.imprimible;
  const NOMBRES = { cierto: "Cierto", falso: "Falso" };
  const TRAZOS = { cierto: "M5 12.5 L10 17.5 L19 7", falso: "M6 6 L18 18 M18 6 L6 18" };
  const $ = (sel) => document.querySelector(sel);
  // Gráficas más compactas para que cada reverso quepa en una hoja carta.
  const ESCALA_PAPEL = 0.62;

  function nodo(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  function dependeDelColor(g) {
    return g.tipo === "columnas" && (g.series.length > 1 || Boolean(g.series[0].colores));
  }

  function recuadro(texto) {
    const caja = nodo("span", "imp-opcion");
    caja.append(nodo("span", "imp-casilla"), nodo("span", "", texto));
    return caja;
  }

  // «Adivina antes de ver» en papel: mismas preguntas que en el juego, con los datos del ámbito.
  const ESTIMAR = { "primer-voto": ["18", "de18"], jovenes: ["18_29", "de18a29"], sesentas: ["60_69", "de60a69"] };

  function estimacion(m, personal) {
    if (!personal || !ESTIMAR[m.id]) return null;
    const [clave, quien] = ESTIMAR[m.id];
    const anio = String(personal.anios.at(-1));
    const valor = personal.estimar[anio][clave];
    if (valor == null) return null;
    return { quien: TEXTOS.estimar[quien], lugar: personal.nombre, anio, valor: Math.round(valor) };
  }

  function frente(m, i, total, est) {
    const hoja = nodo("section", "hoja tarjeta-frente");
    hoja.setAttribute("aria-label", T.frente(i + 1, total));
    hoja.append(
      nodo("p", "hoja-marca", T.folio(i + 1, total, m.nivel, m.nombreNivel)),
      nodo("p", "imp-pregunta", T.pregunta),
      nodo("h2", "imp-mito", m.enunciado),
    );
    if (est) {
      const caja = nodo("div", "imp-estimar");
      caja.append(nodo("p", "", T.estimacionPregunta(est.quien, est.lugar, est.anio)), nodo("p", "imp-espacio", T.estimacionEspacio));
      hoja.append(caja);
    }
    const opciones = nodo("div", "imp-opciones");
    opciones.append(recuadro(NOMBRES.cierto), recuadro(NOMBRES.falso));
    hoja.append(opciones, nodo("p", "hoja-nota", T.instruccionFrente));
    return hoja;
  }

  function reverso(m, i, total, est) {
    const hoja = nodo("section", "hoja tarjeta-reverso");
    hoja.setAttribute("aria-label", T.reverso(i + 1, total));
    const veredicto = nodo("p", "imp-veredicto");
    veredicto.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${TRAZOS[m.veredicto]}"/></svg>`;
    veredicto.append(T.respuesta(NOMBRES[m.veredicto]));
    hoja.append(
      nodo("p", "hoja-marca", T.folio(i + 1, total, m.nivel, m.nombreNivel)),
      nodo("h2", "imp-mito-reverso", m.enunciado),
      veredicto,
    );
    if (est) hoja.append(nodo("p", "imp-dato-real", T.datoReal(est.valor, est.quien, est.lugar, est.anio)));
    hoja.append(nodo("p", "imp-explicacion", m.explicacion));

    const figura = nodo("figure", "grafica imp-grafica");
    const lienzo = nodo("div", "g-lienzo");
    figura.append(nodo("figcaption", "g-titulo", m.grafica.titulo), lienzo);
    if (m.grafica.nota) figura.append(nodo("p", "g-nota", m.grafica.nota));
    // La tabla va cuando la gráfica se lee por colores; las barras ya llevan su valor escrito.
    if (dependeDelColor(m.grafica)) figura.append(Graficas.tabla(m.grafica));
    figura.append(nodo("p", "g-fuente", m.fuente));
    hoja.append(figura);

    const charla = nodo("p", "discusion");
    charla.append(nodo("strong", "", T.paraConversar), ` ${m.discusion}`);
    hoja.append(charla);
    return { hoja, lienzo };
  }

  async function armar() {
    const { datos } = await Datos.mitos();
    const clave = datos.ambito ? datos.ambito.clave : 0;
    const personal = await fetch(`data/entidad/${clave}/personal.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const mitos = datos.niveles.flatMap((n, i) =>
      n.mitos.map((m) => ({ ...m, nivel: i + 1, nombreNivel: n.nombre })));
    const contenedor = $("#tarjetas");
    const lienzos = [];
    mitos.forEach((m, i) => {
      const est = estimacion(m, personal);
      contenedor.append(frente(m, i, mitos.length, est));
      const { hoja, lienzo } = reverso(m, i, mitos.length, est);
      contenedor.append(hoja);
      lienzos.push([lienzo, m.grafica]);
    });
    // Se dibujan ya insertadas para conocer su ancho; sin animación porque es para papel.
    lienzos.forEach(([lienzo, g]) => Graficas.dibujar(lienzo, g, { animado: false, escala: ESCALA_PAPEL }));

    $("#nota-metodo-imprimible").textContent = datos.nota_metodo;
    $("#t-cierre-imprimible").textContent = datos.cierre.titulo;
    $("#cierre-imprimible-texto").textContent = datos.cierre.texto;
    const juego = new URL(Datos.conEntidad("./"), location.href).href;
    $("#url-sitio").textContent = juego;
    $("#volver-juego").href = Datos.conEntidad("./");
    $("#aviso-carga").textContent = T.listas(mitos.length);
  }

  $("#imprimir").addEventListener("click", () => window.print());
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  armar().catch(() => {
    $("#aviso-carga").textContent = T.error;
  });
})();
