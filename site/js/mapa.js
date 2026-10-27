/*
 * Atlas de la participación: mapa de México en SVG: color por participación, zoom animado (viewBox) a una región o a un estado,
 * y etiquetas con texto (nada depende solo del color: cada paso trae también su tabla).
 */
const Mapa = (() => {
  const NS = "http://www.w3.org/2000/svg";
  // Escala fija para todos los años (tonos del rosa INE): así 2021 se ve más claro que 2024.
  const CORTES = [45, 50, 55, 60, 65, 70];
  const COLORES = ["#FBE8F2", "#F4C3DD", "#E893C0", "#D9579D", "#C31C78", "#931C63", "#5C1240"];
  const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  let svg, geo, atlas, porClave, vista, animacion;

  const el = (tag, attrs = {}, padre) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (padre) padre.appendChild(n);
    return n;
  };

  function color(v) {
    if (v == null) return "#FFFFFF";
    let i = 0;
    while (i < CORTES.length && v >= CORTES[i]) i += 1;
    return COLORES[i];
  }

  function iniciar(svgNodo, mapa, datos) {
    svg = svgNodo;
    geo = mapa;
    atlas = datos;
    porClave = Object.fromEntries(atlas.estados.map((e) => [e.clave, e]));
    vista = [0, 0, geo.ancho, geo.alto];
    svg.setAttribute("viewBox", vista.join(" "));
    const capa = svg.querySelector("#a-capa-estados");
    atlas.estados.forEach((e) => {
      const p = el("path", { d: geo.estados[e.clave].d, class: "at-estado", "data-clave": e.clave }, capa);
      el("title", {}, p).textContent = e.nombre;
    });
    const capaR = svg.querySelector("#a-capa-regiones");
    atlas.regiones.forEach((r) => el("path", { d: geo.regiones[r.id].d, class: "at-region", "data-id": r.id }, capaR));
  }

  function leyenda(ol) {
    const L = TEXTOS.atlas.mapa;
    ol.replaceChildren(...COLORES.map((c, i) => {
      const li = document.createElement("li");
      const desde = i === 0 ? null : CORTES[i - 1];
      const hasta = i === CORTES.length ? null : CORTES[i];
      li.innerHTML = `<span class="at-muestra" style="background:${c}"></span>`;
      li.append(L.leyenda(desde, hasta));
      return li;
    }));
  }

  // Caja con margen; si la caja es muy chica (Tlaxcala, CDMX), se agranda para no perder contexto.
  function encuadre(caja) {
    let [x, y, w, h] = caja;
    const minimo = geo.ancho * 0.16;
    if (w < minimo) { x -= (minimo - w) / 2; w = minimo; }
    if (h < minimo * 0.7) { y -= (minimo * 0.7 - h) / 2; h = minimo * 0.7; }
    const m = Math.max(w, h) * 0.08;
    return [x - m, y - m, w + 2 * m, h + 2 * m];
  }

  function animar(destino) {
    cancelAnimationFrame(animacion);
    const origen = vista.slice();
    if (sinMovimiento()) {
      vista = destino;
      svg.setAttribute("viewBox", vista.join(" "));
      return;
    }
    const inicio = performance.now();
    const dur = 900;
    const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / dur);
      const k = suave(t);
      vista = origen.map((v, i) => v + (destino[i] - v) * k);
      svg.setAttribute("viewBox", vista.map((v) => v.toFixed(1)).join(" "));
      if (t < 1) animacion = requestAnimationFrame(paso);
    };
    animacion = requestAnimationFrame(paso);
  }

  /*
   * opciones: { anio, region, estado, resaltar: [claves], etiquetas: [claves], regiones: bool }
   * Devuelve las filas [nombre, valor] que describe el mapa, para la descripción accesible.
   */
  function pintar(op) {
    const anio = String(op.anio);
    const enFoco = (e) => (op.region ? e.region === op.region : op.estado ? e.clave === op.estado : true);
    svg.querySelectorAll(".at-estado").forEach((p) => {
      const e = porClave[p.dataset.clave];
      const v = e.participacion[anio];
      const dentro = enFoco(e);
      p.style.fill = dentro ? color(v) : "";
      p.classList.toggle("at-atenuado", !dentro);
      p.classList.toggle("at-resaltado", (op.resaltar || []).includes(e.clave) || e.clave === op.estado);
      p.querySelector("title").textContent = `${e.nombre}: ${TEXTOS.atlas.pct(v)}`;
    });
    svg.querySelectorAll(".at-region").forEach((p) => {
      p.classList.toggle("at-visible", !!op.regiones || p.dataset.id === op.region);
    });

    const caja = op.estado ? geo.estados[op.estado].caja
      : op.region ? geo.regiones[op.region].caja
      : [0, 0, geo.ancho, geo.alto];
    const destino = encuadre(caja);
    animar(destino);

    // Etiquetas: tamaño constante en pantalla aunque cambie el zoom.
    const capa = svg.querySelector("#a-capa-etiquetas");
    capa.replaceChildren();
    // Unidades del mapa por píxel en pantalla, para el zoom de destino.
    const pantalla = svg.getBoundingClientRect();
    const k = pantalla.width ? Math.max(destino[2] / pantalla.width, destino[3] / pantalla.height) : destino[2] / 600;
    const px = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const tam = px * 0.875 * k;
    const claves = op.etiquetas || [];
    const puestas = [];
    claves.forEach((c) => {
      const e = porClave[c];
      const [x, y] = geo.estados[c].centro;
      const t = el("text", { x, y, class: "at-etiqueta", "font-size": tam.toFixed(2), "text-anchor": "middle" }, capa);
      el("tspan", { x, dy: 0, class: "at-etq-nombre" }, t).textContent = TEXTOS.atlas.mapa.corto[c] || e.nombre;
      el("tspan", { x, dy: (tam * 1.15).toFixed(2), class: "at-etq-valor" }, t).textContent = TEXTOS.atlas.pct(e.participacion[anio]);
      acomodar(t, puestas, destino);
    });
    if (op.regiones) {
      atlas.regiones.forEach((r) => {
        const [x, y] = geo.regiones[r.id].centro;
        const t = el("text", { x, y, class: "at-etiqueta at-etq-region", "font-size": (tam * 1.1).toFixed(2), "text-anchor": "middle" }, capa);
        // Nombres largos en dos renglones: «Golfo y / Península».
        const partes = r.nombre.includes(" y ") ? r.nombre.split(/ (?=y )/) : [r.nombre];
        partes.forEach((parte, i) => {
          el("tspan", { x, dy: i ? (tam * 1.2).toFixed(2) : 0 }, t).textContent = parte;
        });
        acomodar(t, puestas, destino);
      });
    }
    return atlas.estados.filter(enFoco).map((e) => [e.nombre, e.participacion[anio]]);
  }

  // Si una etiqueta choca con otra ya puesta, se mueve arriba o abajo hasta encontrar lugar.
  function acomodar(t, puestas, [vx, , vw]) {
    const choca = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const base = t.getBBox();
    // Que no se salga por los lados del encuadre.
    let dx = 0;
    if (base.x < vx) dx = vx - base.x + 2;
    else if (base.x + base.width > vx + vw) dx = vx + vw - base.x - base.width - 2;
    base.x += dx;
    const salto = base.height * 0.6;
    for (const n of [0, 1, -1, 2, -2, 3, -3, 4]) {
      const r = { x: base.x, y: base.y + n * salto, width: base.width, height: base.height };
      if (!puestas.some((p) => choca(p, r))) {
        if (n || dx) t.setAttribute("transform", `translate(${dx.toFixed(2)} ${(n * salto).toFixed(2)})`);
        puestas.push(r);
        return;
      }
    }
    if (dx) t.setAttribute("transform", `translate(${dx.toFixed(2)} 0)`);
    puestas.push({ x: base.x, y: base.y, width: base.width, height: base.height });
  }

  // En el último paso, tocar un estado en el mapa también lo elige.
  function alTocar(fn) {
    svg.addEventListener("click", (ev) => {
      const p = ev.target.closest(".at-estado");
      if (p) fn(Number(p.dataset.clave));
    });
  }

  return { iniciar, pintar, leyenda, alTocar, color };
})();
