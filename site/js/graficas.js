/*
 * Gráficas en SVG sin dependencias: barras horizontales, columnas agrupadas y líneas.
 * Cada gráfica recibe una especificación (ver site/data/mitos.json) y se vuelve a
 * dibujar al cambiar el ancho del contenedor. El eje de porcentaje siempre va de 0 a 100.
 */
const Graficas = (() => {
  const SVG = "http://www.w3.org/2000/svg";
  const COLORES = { datos: "#2563EB", base: "#6B7280", acento: "#D97706", pista: "#E5E7EB" };
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let contadorId = 0;
  // Factor del tamaño de letra elegido (1 = 16 px): la geometría crece con el texto.
  // Se puede fijar al dibujar (p. ej. más pequeña para imprimir).
  let escalaFija = null;
  const escala = () => escalaFija ?? parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

  const fmt = (v) => (v == null ? TEXTOS.graficas.sinDato : `${v.toFixed(1)}%`);

  function el(nombre, attrs = {}, padre) {
    const nodo = document.createElementNS(SVG, nombre);
    for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
    if (padre) padre.appendChild(nodo);
    return nodo;
  }

  function texto(padre, x, y, contenido, attrs = {}) {
    const t = el("text", { x, y, ...attrs }, padre);
    t.textContent = contenido;
    return t;
  }

  // ---------- descripción accesible y tabla

  function describir(spec) {
    if (spec.tipo === "unidades") {
      const si = Math.round(spec.valor);
      return TEXTOS.graficas.unidades(spec.titulo, spec.etiqueta, si, 100 - si);
    }
    if (spec.tipo === "barras") {
      return `${spec.titulo}. ` + spec.items.map((i) => `${i.etiqueta}: ${fmt(i.valor)}`).join("; ") + ".";
    }
    const partes = spec.series.map((s) => {
      const pares = spec.x.map((x, k) => [x, s.valores[k]]).filter((p) => p[1] != null);
      const nombre = spec.series.length > 1 ? `${s.nombre}: ` : "";
      if (pares.length <= 8) return nombre + pares.map(([x, v]) => `${x}, ${fmt(v)}`).join("; ");
      const min = pares.reduce((a, b) => (b[1] < a[1] ? b : a));
      const max = pares.reduce((a, b) => (b[1] > a[1] ? b : a));
      return nombre + TEXTOS.graficas.resumenSerie(fmt(pares[0][1]), pares[0][0], fmt(pares.at(-1)[1]),
        pares.at(-1)[0], fmt(min[1]), min[0], fmt(max[1]), max[0]);
    });
    let desc = `${spec.titulo}. ${partes.join(". ")}.`;
    if (spec.referencia) desc += ` ${spec.referencia.etiqueta}.`;
    return desc;
  }

  function tabla(spec) {
    const t = document.createElement("table");
    const cab = t.createTHead().insertRow();
    const filas = t.createTBody();
    const th = (fila, txt, num) => {
      const c = document.createElement("th");
      c.textContent = txt;
      if (num) c.className = "num";
      fila.appendChild(c);
    };
    if (spec.tipo === "unidades") {
      th(cab, spec.etiqueta[0].toUpperCase() + spec.etiqueta.slice(1));
      th(cab, TEXTOS.graficas.deCada100, true);
      const si = Math.round(spec.valor);
      [[TEXTOS.graficas.votaron, si], [TEXTOS.graficas.noVotaron, 100 - si]].forEach(([n, v]) => {
        const f = filas.insertRow();
        f.insertCell().textContent = n;
        const c = f.insertCell();
        c.textContent = String(v);
        c.className = "num";
      });
      return t;
    }
    if (spec.tipo === "barras") {
      th(cab, TEXTOS.graficas.grupo);
      th(cab, TEXTOS.graficas.participacion, true);
      spec.items.forEach((i) => {
        const f = filas.insertRow();
        f.insertCell().textContent = i.etiqueta;
        const c = f.insertCell();
        c.textContent = fmt(i.valor);
        c.className = "num";
      });
    } else {
      th(cab, spec.x_titulo || TEXTOS.graficas.anio);
      // Si las columnas se distinguen por color (p. ej. presidencial o intermedia), la tabla lo dice con palabras.
      const tipos = spec.leyenda && spec.series[0].colores
        ? spec.series[0].colores.map((c) => (spec.leyenda.find((l) => l.color === c) || {}).nombre || "")
        : null;
      if (tipos) th(cab, TEXTOS.graficas.tipo);
      spec.series.forEach((s) => th(cab, s.nombre, true));
      spec.x.forEach((x, k) => {
        const f = filas.insertRow();
        f.insertCell().textContent = x;
        if (tipos) f.insertCell().textContent = tipos[k];
        spec.series.forEach((s) => {
          const c = f.insertCell();
          c.textContent = fmt(s.valores[k]);
          c.className = "num";
        });
      });
    }
    return t;
  }

  // ---------- lienzo base

  function lienzo(contenedor, spec, alto) {
    const ancho = Math.max(280, contenedor.clientWidth || 320);
    const id = `g${++contadorId}`;
    const svg = el("svg", {
      viewBox: `0 0 ${ancho} ${alto}`,
      width: ancho,
      height: alto,
      role: "img",
      "aria-labelledby": `${id}-t ${id}-d`,
    });
    el("title", { id: `${id}-t` }, svg).textContent = spec.titulo;
    el("desc", { id: `${id}-d` }, svg).textContent = spec.alt || describir(spec);
    return { svg, ancho, alto };
  }

  function leyenda(contenedor, elementos) {
    const ul = document.createElement("ul");
    ul.className = "leyenda";
    ul.setAttribute("aria-hidden", "true");
    elementos.forEach((e) => {
      const li = document.createElement("li");
      const m = document.createElement("span");
      m.className = "muestra";
      m.style.background = COLORES[e.color];
      li.append(m, e.nombre);
      ul.appendChild(li);
    });
    contenedor.appendChild(ul);
  }

  function ejeY(g, x0, x1, y, h) {
    [0, 25, 50, 75, 100].forEach((v) => {
      const yy = y(v);
      el("line", { x1: x0, x2: x1, y1: yy, y2: yy, class: "rejilla" }, g);
      texto(g, x0 - 6, yy + 4, `${v}%`, { class: "eje", "text-anchor": "end" });
    });
  }

  // ---------- barras horizontales

  function barras(contenedor, spec) {
    const k = escala();
    // Con muchas categorías (p. ej. grupos de edad) la etiqueta va a la izquierda de su barra, en el mismo renglón.
    const enLinea = spec.items.length > 8;
    const izq = enLinea ? (Math.max(...spec.items.map((it) => it.etiqueta.length)) * 9 + 12) * k : 0;
    const fila = (enLinea ? 28 : (spec.compacto ? 42 : 50)) * k;
    const grosor = (enLinea ? 14 : (spec.compacto ? 12 : 16)) * k;
    const yBarra = enLinea ? (fila - grosor) / 2 : 24 * k;
    const alto = spec.items.length * fila + 4;
    const { svg, ancho } = lienzo(contenedor, spec, alto);
    const espacioValor = 58 * k;
    const largo = ancho - espacioValor - izq;
    const pausa = spec.items.length > 12 ? 15 : 60;
    spec.items.forEach((item, i) => {
      const y = i * fila;
      texto(svg, 0, enLinea ? y + yBarra + grosor - 1 : y + 17 * k, item.etiqueta, { class: "etiqueta", "font-weight": item.color === "acento" ? 700 : 400 });
      el("rect", { x: izq, y: y + yBarra, width: largo, height: grosor, rx: 2, fill: COLORES.pista }, svg);
      const w = (largo * (item.valor || 0)) / 100;
      el("rect", {
        x: izq, y: y + yBarra, width: w, height: grosor, rx: 2,
        fill: COLORES[item.color || "datos"], class: "crece-x",
        style: `transition-delay:${i * pausa}ms`,
      }, svg);
      texto(svg, izq + w + 6, y + yBarra + grosor - 2, fmt(item.valor), { class: "valor aparece" });
    });
    return svg;
  }

  // ---------- columnas (agrupadas o con color por columna)

  function columnas(contenedor, spec) {
    const elementosLeyenda = spec.leyenda || (spec.series.length > 1
      ? spec.series.map((s) => ({ nombre: s.nombre, color: s.color })) : null);
    if (elementosLeyenda) leyenda(contenedor, elementosLeyenda);

    const k = escala();
    const m = { izq: 44 * k, der: 4, arr: 12 * k, aba: 30 * k };
    const anchoDisponible = Math.max(280, contenedor.clientWidth || 320);
    const grupo = (anchoDisponible - m.izq - m.der) / spec.x.length;
    const n = spec.series.length;
    const hueco = grupo * 0.14;
    const col = (grupo - hueco * 2) / n;
    // Sin espacio para escribir el valor sobre cada columna: se usan barras horizontales.
    if (col < 38 * k) return barrasAgrupadas(contenedor, spec);

    const alto = 280 * k;
    const { svg, ancho } = lienzo(contenedor, spec, alto);
    const h = alto - m.arr - m.aba;
    const y = (v) => m.arr + h - (h * v) / 100;
    ejeY(svg, m.izq, ancho - m.der, y, h);

    // i es la posición de la categoría; k es el factor de escala.
    spec.x.forEach((etiqueta, i) => {
      const gx = m.izq + i * grupo;
      texto(svg, gx + grupo / 2, alto - 8 * k, etiqueta, { class: "eje", "text-anchor": "middle" });
      spec.series.forEach((s, j) => {
        const v = s.valores[i];
        if (v == null) return;
        const x = gx + hueco + j * col;
        const color = COLORES[(s.colores && s.colores[i]) || s.color || "datos"];
        el("rect", {
          x: x + 1, y: y(v), width: col - 2, height: y(0) - y(v), rx: 2,
          fill: color, class: "crece-y", style: `transition-delay:${i * 70}ms`,
        }, svg);
        texto(svg, x + col / 2, y(v) - 6, v.toFixed(1), { class: "valor aparece", "text-anchor": "middle" });
      });
    });
    el("line", { x1: m.izq, x2: ancho - m.der, y1: y(0), y2: y(0), stroke: "#1F2937" }, svg);
    return svg;
  }

  // Versión horizontal de las columnas: una fila por categoría y una barra por serie.
  function barrasAgrupadas(contenedor, spec) {
    const n = spec.series.length;
    const e = escala();
    const grosor = 14 * e;
    const filaCat = 26 * e + n * (grosor + 6) + 10;
    const alto = spec.x.length * filaCat;
    const { svg, ancho } = lienzo(contenedor, spec, alto);
    const largo = ancho - 58 * e;
    spec.x.forEach((etiqueta, k) => {
      const y0 = k * filaCat;
      texto(svg, 0, y0 + 17 * e, etiqueta, { class: "etiqueta", "font-weight": 700 });
      spec.series.forEach((s, j) => {
        const v = s.valores[k];
        if (v == null) return;
        const y = y0 + 26 * e + j * (grosor + 6);
        const w = (largo * v) / 100;
        el("rect", { x: 0, y, width: largo, height: grosor, rx: 2, fill: COLORES.pista }, svg);
        el("rect", {
          x: 0, y, width: w, height: grosor, rx: 2,
          fill: COLORES[(s.colores && s.colores[k]) || s.color || "datos"],
          class: "crece-x", style: `transition-delay:${k * 60}ms`,
        }, svg);
        texto(svg, w + 6, y + grosor - 2, fmt(v), { class: "valor aparece" });
      });
    });
    return svg;
  }

  // ---------- unidades: 100 casillas de boleta, con X en las que votaron

  function unidades(contenedor, spec) {
    const k = escala();
    const ancho = Math.max(280, contenedor.clientWidth || 320);
    const sep = 4 * k;
    const lado = Math.min((spec.compacto ? 22 : 30) * k, (ancho - 9 * sep) / 10);
    const rejilla = lado * 10 + sep * 9;
    const altoLeyenda = 34 * k;
    const { svg } = lienzo(contenedor, spec, rejilla + altoLeyenda + 8);
    const si = Math.round(spec.valor);
    const trazo = Math.max(2, lado / 8);
    for (let i = 0; i < 100; i += 1) {
      const x = (i % 10) * (lado + sep);
      const y = Math.floor(i / 10) * (lado + sep);
      const voto = i < si;
      el("rect", {
        x, y, width: lado, height: lado, rx: 2, fill: "#FFFFFF",
        stroke: voto ? "#1F2937" : COLORES.base, "stroke-width": voto ? trazo * 0.8 : trazo * 0.6,
      }, svg);
      if (voto) {
        const m = lado * 0.24;
        el("path", {
          d: `M${x + m},${y + m} L${x + lado - m},${y + lado - m} M${x + lado - m},${y + m} L${x + m},${y + lado - m}`,
          stroke: COLORES.datos, "stroke-width": trazo, "stroke-linecap": "round", fill: "none",
          class: "aparece", style: `transition-delay:${0.2 + i * 0.012}s`,
        }, svg);
      }
    }
    // Leyenda con texto: no depende del color.
    const yl = rejilla + altoLeyenda - 8 * k;
    const caja = 16 * k;
    el("rect", { x: 0, y: yl - caja + 3, width: caja, height: caja, rx: 2, fill: "#FFFFFF", stroke: "#1F2937", "stroke-width": 2 }, svg);
    el("path", { d: `M3,${yl - caja + 6} L${caja - 3},${yl} M${caja - 3},${yl - caja + 6} L3,${yl}`, stroke: COLORES.datos, "stroke-width": 2.5, fill: "none" }, svg);
    texto(svg, caja + 8, yl, TEXTOS.graficas.leyendaSi(si), { class: "etiqueta", "font-weight": 700 });
    const x2 = rejilla / 2 + 8;
    el("rect", { x: x2, y: yl - caja + 3, width: caja, height: caja, rx: 2, fill: "#FFFFFF", stroke: COLORES.base, "stroke-width": 2 }, svg);
    texto(svg, x2 + caja + 8, yl, TEXTOS.graficas.leyendaNo(100 - si), { class: "etiqueta" });
    return svg;
  }

  // ---------- líneas

  function linea(contenedor, spec) {
    if (spec.series.length > 1) leyenda(contenedor, spec.series.map((s) => ({ nombre: s.nombre, color: s.color })));
    const k = escala();
    const alto = 280 * k;
    const { svg, ancho } = lienzo(contenedor, spec, alto);
    const m = { izq: 44 * k, der: 16, arr: 26 * k, aba: (spec.x_titulo ? 50 : 30) * k };
    const h = alto - m.arr - m.aba;
    const y = (v) => m.arr + h - (h * v) / 100;
    const paso = (ancho - m.izq - m.der) / Math.max(1, spec.x.length - 1);
    const x = (k) => m.izq + k * paso;
    ejeY(svg, m.izq, ancho - m.der, y, h);

    const anchoEtiqueta = (Math.max(...spec.x.map((e) => e.length)) * 8 + 12) * k;
    const cada = Math.ceil(spec.x.length / Math.max(2, Math.floor((ancho - m.izq - m.der) / anchoEtiqueta)));
    spec.x.forEach((etq, k) => {
      const ultimo = k === spec.x.length - 1 && k % cada >= cada * 0.6;
      if (k % cada === 0 || ultimo) {
        // Que la última etiqueta no se corte con letra grande: se recorre hacia dentro si hace falta.
        const xx = Math.min(x(k), ancho - 2 - etq.length * 4.6 * escala());
        texto(svg, xx, alto - m.aba + 20 * escala(), etq, { class: "eje", "text-anchor": "middle" });
      }
    });
    if (spec.x_titulo) {
      texto(svg, m.izq + (ancho - m.izq - m.der) / 2, alto - 6 * k, spec.x_titulo, { class: "eje", "text-anchor": "middle" });
    }

    if (spec.referencia) {
      const ry = y(spec.referencia.valor);
      el("line", {
        x1: m.izq, x2: ancho - m.der, y1: ry, y2: ry,
        stroke: COLORES.acento, "stroke-width": 2, "stroke-dasharray": "6 4",
      }, svg);
      texto(svg, ancho - m.der, ry - 6, spec.referencia.etiqueta, { class: "eje aparece", "text-anchor": "end" });
    }

    spec.series.forEach((s) => {
      const puntos = s.valores.map((v, k) => (v == null ? null : [x(k), y(v)])).filter(Boolean);
      const d = puntos.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
      el("path", {
        d, fill: "none", stroke: COLORES[s.color || "datos"], "stroke-width": 3,
        "stroke-linejoin": "round", "stroke-linecap": "round", class: "traza",
      }, svg);
    });

    const s0 = spec.series[0];
    (spec.marcas || []).forEach((k) => {
      const v = s0.valores[k];
      if (v == null) return;
      el("circle", { cx: x(k), cy: y(v), r: 5, fill: "#FFFFFF", stroke: COLORES.datos, "stroke-width": 3, class: "aparece" }, svg);
      const ancla = k === 0 ? "start" : k === spec.x.length - 1 ? "end" : "middle";
      // La etiqueta va debajo si el punto queda más bajo que sus vecinos.
      const vecinos = [s0.valores[k - 1], s0.valores[k + 1]].filter((n) => n != null);
      const bajo = vecinos.length && v < vecinos.reduce((a, b) => a + b, 0) / vecinos.length;
      const arriba = (bajo ? 24 : -12) * escala();
      texto(svg, x(k), y(v) + arriba, fmt(v), { class: "valor aparece", "text-anchor": ancla });
    });
    return svg;
  }

  // ---------- animación

  function animar(svg) {
    svg.querySelectorAll(".traza").forEach((p) => {
      const largo = p.getTotalLength();
      p.style.strokeDasharray = largo;
      p.style.strokeDashoffset = largo;
      p.classList.add("linea-anim");
    });
    svg.querySelectorAll(".crece-x, .crece-y, .aparece").forEach((n) => n.classList.add("inicio"));
    // Dos cuadros para que el navegador pinte el estado inicial antes de animar.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      svg.querySelectorAll(".traza").forEach((p) => { p.style.strokeDashoffset = 0; });
      svg.querySelectorAll(".inicio").forEach((n) => n.classList.remove("inicio"));
    }));
  }

  // ---------- API pública

  const dibujantes = { barras, columnas, linea, unidades };
  const observados = new WeakMap();
  const activos = new Set();

  function redibujar() {
    activos.forEach((c) => {
      const actual = observados.get(c);
      if (c.isConnected && actual && actual.spec && c.offsetParent) dibujar(c, actual.spec, { ...actual.opciones, animado: false });
    });
  }

  function dibujar(contenedor, spec, opciones = {}) {
    const { animado = true, escala: fija = null } = opciones;
    contenedor.replaceChildren();
    escalaFija = fija;
    let svg;
    try {
      svg = dibujantes[spec.tipo](contenedor, spec);
    } finally {
      escalaFija = null;
    }
    contenedor.appendChild(svg);
    if (animado && !sinMovimiento) animar(svg);

    if (!observados.has(contenedor)) {
      let ultimoAncho = contenedor.clientWidth;
      const ro = new ResizeObserver(() => {
        const w = contenedor.clientWidth;
        // Oculta (p. ej. en otra pestaña de «Ver los datos»): se redibuja al volver a mostrarse.
        if (!w || Math.abs(w - ultimoAncho) < 8) return;
        ultimoAncho = w;
        const actual = observados.get(contenedor);
        if (actual.spec) dibujar(contenedor, actual.spec, { ...actual.opciones, animado: false });
      });
      ro.observe(contenedor);
      observados.set(contenedor, { ro });
    }
    observados.get(contenedor).spec = spec;
    observados.get(contenedor).opciones = opciones;
    activos.add(contenedor);
  }

  return { dibujar, redibujar, tabla, describir, COLORES, fmt };
})();
