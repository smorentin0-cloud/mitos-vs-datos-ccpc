/*
 * Gráficas SVG del mapa: tu estado o municipio (rosa INE) frente a la referencia, México o el estado (gris).
 * Son decorativas para el lector de pantalla: cada una tiene su tabla con los mismos datos.
 */
const GraficasAtlas = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const C = { estado: "#C31C78", pais: "#5E6573", base: "#E5E7EB", tinta: "#1D1D1D", suave: "#4B5563" };
  const el = (tag, attrs = {}, padre) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (padre) padre.appendChild(n);
    return n;
  };
  const txt = (padre, x, y, s, attrs = {}) => {
    const t = el("text", { x, y, ...attrs }, padre);
    t.textContent = s;
    return t;
  };
  const escala = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

  function lienzo(contenedor, alto) {
    contenedor.replaceChildren();
    const ancho = Math.max(280, contenedor.clientWidth || 320);
    const svg = el("svg", { viewBox: `0 0 ${ancho} ${alto}`, width: "100%", "aria-hidden": "true", class: "at-svg" }, contenedor);
    return { svg, ancho };
  }

  function leyenda(contenedor, nombres) {
    const ul = document.createElement("ul");
    ul.className = "at-leyenda";
    ul.setAttribute("aria-hidden", "true");
    nombres.forEach(([n, c, linea]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="at-muestra-g ${linea ? "linea" : ""}" style="--c:${c}"></span>`;
      li.append(n);
      ul.appendChild(li);
    });
    contenedor.prepend(ul);
  }

  // Línea: participación por elección, con el año elegido marcado.
  function historia(contenedor, { anios, estado, pais, nombre, nombreRef = TEXTOS.atlas.compara.nacional, anioActivo }) {
    const k = escala();
    const alto = 240 * k;
    const { svg, ancho } = lienzo(contenedor, alto);
    const m = { izq: 40 * k, der: 16 * k, arr: 20 * k, aba: 30 * k };
    const todos = [...estado, ...pais].filter((v) => v != null);
    const min = Math.floor(Math.min(...todos) / 10) * 10;
    const max = Math.ceil(Math.max(...todos) / 10) * 10;
    const y = (v) => m.arr + (alto - m.arr - m.aba) * (1 - (v - min) / (max - min));
    const x = (i) => m.izq + (ancho - m.izq - m.der) * (i / (anios.length - 1));
    for (let v = min; v <= max; v += 10) {
      el("line", { x1: m.izq, x2: ancho - m.der, y1: y(v), y2: y(v), stroke: C.base }, svg);
      txt(svg, m.izq - 6, y(v) + 4 * k, `${v}%`, { "text-anchor": "end", class: "at-eje" });
    }
    anios.forEach((a, i) => {
      if (String(a) === String(anioActivo)) {
        el("rect", { x: x(i) - 18 * k, y: m.arr - 8, width: 36 * k, height: alto - m.arr - m.aba + 8, fill: "#EFEBEB" }, svg);
      }
      txt(svg, x(i), alto - 8 * k, a, { "text-anchor": "middle", class: "at-eje", "font-weight": String(a) === String(anioActivo) ? 700 : 400 });
    });
    [[pais, C.pais, "6 4"], [estado, C.estado, ""]].forEach(([serie, col, guiones]) => {
      const pts = serie.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
      el("polyline", { points: pts.join(" "), fill: "none", stroke: col, "stroke-width": 3 * k, "stroke-dasharray": guiones, "stroke-linejoin": "round" }, svg);
      serie.forEach((v, i) => v != null && el("circle", { cx: x(i), cy: y(v), r: 4 * k, fill: "#fff", stroke: col, "stroke-width": 2.5 * k }, svg));
    });
    leyenda(contenedor, [[nombre, C.estado, true], [nombreRef, C.pais, true]]);
  }

  // Barras pareadas por categoría: estado arriba, país abajo, con el valor escrito.
  function pares(contenedor, { categorias, estado, pais, nombre }) {
    const k = escala();
    const etq = 86 * k, valor = 52 * k, grosor = 14 * k, hueco = 3 * k, fila = grosor * 2 + hueco + 16 * k;
    const alto = categorias.length * fila;
    const { svg, ancho } = lienzo(contenedor, alto);
    const largo = ancho - etq - valor;
    categorias.forEach((c, i) => {
      const y0 = i * fila;
      txt(svg, 0, y0 + grosor + 4 * k, c, { class: "at-cat" });
      [[estado[i], C.estado, 0], [pais[i], C.pais, grosor + hueco]].forEach(([v, col, dy]) => {
        el("rect", { x: etq, y: y0 + dy, width: largo, height: grosor, fill: "#EFEBEB", rx: 2 }, svg);
        if (v == null) {
          txt(svg, etq + 6, y0 + dy + grosor - 3 * k, TEXTOS.atlas.compara.sinDato, { class: "at-valor sin" });
          return;
        }
        el("rect", { x: etq, y: y0 + dy, width: (largo * v) / 100, height: grosor, fill: col, rx: 2, class: "at-barra" }, svg);
        txt(svg, etq + (largo * v) / 100 + 6, y0 + dy + grosor - 2 * k, TEXTOS.atlas.pct(v), { class: "at-valor" });
      });
    });
    leyenda(contenedor, [[nombre, C.estado], [TEXTOS.atlas.compara.nacional, C.pais]]);
  }

  function tabla(contenedor, cabeza, filas) {
    const t = document.createElement("table");
    const fila = (celdas, th) => `<tr>${celdas.map((c, i) => (th || i === 0 ? `<th scope="${th ? "col" : "row"}">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`;
    t.innerHTML = `<thead>${fila(cabeza, true)}</thead><tbody>${filas.map((f) => fila(f)).join("")}</tbody>`;
    contenedor.replaceChildren(t);
  }

  return { historia, pares, tabla };
})();
