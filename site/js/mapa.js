/*
 * Mapa de México en SVG para el Recorrido y para Explorar: color por participación, zoom animado (viewBox)
 * a una región o a un estado, y etiquetas con texto. Nada depende solo del color: el valor va en el nombre
 * de cada estado, en el panel y en la tabla; «sin dato» lleva trama de rayas.
 * Mapa.crear() devuelve un mapa independiente: la pantalla tiene dos (Explorar y Recorrido).
 */
const Mapa = (() => {
  const NS = "http://www.w3.org/2000/svg";
  // Cinco tonos del rosa INE con pasos de claridad parecidos: se distinguen también con daltonismo.
  const COLORES = ["#FCE7F2", "#F0A6CB", "#D9579D", "#A3195F", "#5C1240"];
  const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const L = () => TEXTOS.mapa;

  const el = (tag, attrs = {}, padre) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (padre) padre.appendChild(n);
    return n;
  };

  // Cuatro cortes enteros entre el percentil 10 y el 90: cinco clases con estados en casi todas,
  // y los extremos abiertos («menos de…», «… o más»). Quien llama decide con qué valores:
  // el Recorrido usa todos los años (2021 se ve más claro que 2024); Explorar, el año elegido.
  function escala(valores) {
    const v = valores.filter((x) => x != null).sort((a, b) => a - b);
    const q = (p) => v[Math.floor(p * (v.length - 1))];
    const desde = Math.round(q(0.1));
    const paso = Math.max(1, Math.round((q(0.9) - desde) / 3));
    return [0, 1, 2, 3].map((i) => desde + paso * i);
  }

  function color(v, cortes, trama) {
    if (v == null) return `url(#${trama})`;
    let i = 0;
    while (i < cortes.length && v >= cortes[i]) i += 1;
    return COLORES[i];
  }

  // Leyenda en «de cada 100», con la muestra de «sin dato».
  function leyenda(ol, cortes, conSinDato = true) {
    const items = COLORES.map((c, i) => {
      const li = document.createElement("li");
      const desde = i === 0 ? null : cortes[i - 1];
      const hasta = i === cortes.length ? null : cortes[i];
      li.innerHTML = `<span class="at-muestra" style="background:${c}"></span>`;
      li.append(L().leyenda(desde, hasta));
      return li;
    });
    if (conSinDato) {
      const li = document.createElement("li");
      li.innerHTML = '<span class="at-muestra at-muestra-sin"></span>';
      li.append(L().sinDato);
      items.push(li);
    }
    ol.replaceChildren(...items);
  }

  /*
   * svg: <svg> con <g class="capa-estados">, <g class="capa-regiones"> y <g class="capa-etiquetas">.
   * opciones.teclado: los estados se recorren con flechas (un solo alto de Tab) y se eligen con Enter.
   */
  function crear(svg, geo, atlas, opciones = {}) {
    const porClave = Object.fromEntries(atlas.estados.map((e) => [e.clave, e]));
    let vista = [0, 0, geo.ancho, geo.alto];
    let animacion;
    let alElegir = () => {};
    let alEnfocar = () => {};
    svg.setAttribute("viewBox", vista.join(" "));

    // Trama de rayas para «sin dato» (un id por mapa: hay dos en la página).
    const trama = `trama-${svg.id}`;
    const defs = el("defs", {}, svg);
    const patron = el("pattern", { id: trama, width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 8, height: 8, fill: "#FFFFFF" }, patron);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#5E6573", "stroke-width": 2 }, patron);
    svg.prepend(defs);

    const capa = svg.querySelector(".capa-estados");
    const orden = atlas.estados.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    atlas.estados.forEach((e) => {
      const p = el("path", { d: geo.estados[e.clave].d, class: "at-estado", "data-clave": e.clave }, capa);
      if (opciones.teclado) {
        p.setAttribute("role", "button");
        p.setAttribute("tabindex", "-1");
      } else {
        el("title", {}, p).textContent = e.nombre;
      }
    });
    const capaR = svg.querySelector(".capa-regiones");
    atlas.regiones.forEach((r) => el("path", { d: geo.regiones[r.id].d, class: "at-region", "data-id": r.id }, capaR));

    const caminos = () => [...svg.querySelectorAll(".at-estado")];
    const camino = (clave) => svg.querySelector(`.at-estado[data-clave="${clave}"]`);

    if (opciones.teclado) {
      // Tabindex móvil: solo un estado entra en el orden de Tab; las flechas mueven entre ellos (orden alfabético).
      const enfocar = (clave) => {
        caminos().forEach((p) => p.setAttribute("tabindex", Number(p.dataset.clave) === clave ? "0" : "-1"));
        camino(clave).focus();
      };
      camino(orden[0].clave).setAttribute("tabindex", "0");
      svg.addEventListener("keydown", (ev) => {
        const p = ev.target.closest(".at-estado");
        if (!p) return;
        const i = orden.findIndex((e) => e.clave === Number(p.dataset.clave));
        const n = orden.length;
        const destino = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[ev.key];
        if (destino !== undefined) {
          ev.preventDefault();
          enfocar(orden[(destino + n) % n].clave);
        } else if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          alElegir(Number(p.dataset.clave));
        }
      });
      svg.addEventListener("focusin", (ev) => {
        const p = ev.target.closest(".at-estado");
        if (p) alEnfocar(Number(p.dataset.clave));
      });
      svg.addEventListener("pointerover", (ev) => {
        const p = ev.target.closest(".at-estado");
        if (p) alEnfocar(Number(p.dataset.clave));
      });
    }
    svg.addEventListener("click", (ev) => {
      const p = ev.target.closest(".at-estado");
      if (p) alElegir(Number(p.dataset.clave));
    });

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
     * op: { anio, valor(e) → número|null, cortes, nombre(e, v) → nombre accesible,
     *       region, estado, enfocar (región o estado a encuadrar), resaltar: [claves], etiquetas: [claves], regiones: bool }
     * Devuelve las filas [nombre, valor] que describe el mapa, para la descripción accesible.
     */
    function pintar(op) {
      const anio = String(op.anio);
      const valor = op.valor || ((e) => e.participacion[anio]);
      const enFoco = (e) => (op.region ? e.region === op.region : op.estado && !op.soloResaltar ? e.clave === op.estado : true);
      caminos().forEach((p) => {
        const e = porClave[p.dataset.clave];
        const v = valor(e);
        const dentro = enFoco(e);
        p.style.fill = dentro ? color(v, op.cortes, trama) : "";
        p.classList.toggle("at-atenuado", !dentro);
        p.classList.toggle("at-resaltado", (op.resaltar || []).includes(e.clave) || e.clave === op.estado);
        const nombre = op.nombre ? op.nombre(e, v) : `${e.nombre}: ${L().deCada100(v)}`;
        if (opciones.teclado) {
          p.setAttribute("aria-label", nombre);
          p.setAttribute("aria-pressed", String(e.clave === op.estado));
        } else {
          p.querySelector("title").textContent = nombre;
        }
      });
      svg.querySelectorAll(".at-region").forEach((p) => {
        p.classList.toggle("at-visible", !!op.regiones || p.dataset.id === op.region);
      });

      const zoomEstado = op.estado && !op.soloResaltar;
      const caja = op.encuadre ? op.encuadre
        : zoomEstado ? geo.estados[op.estado].caja
        : op.region ? geo.regiones[op.region].caja
        : [0, 0, geo.ancho, geo.alto];
      const destino = encuadre(caja);
      animar(destino);

      // Etiquetas: tamaño constante en pantalla aunque cambie el zoom.
      const capaE = svg.querySelector(".capa-etiquetas");
      capaE.replaceChildren();
      // Unidades del mapa por píxel en pantalla, para el zoom de destino.
      const pantalla = svg.getBoundingClientRect();
      const k = pantalla.width ? Math.max(destino[2] / pantalla.width, destino[3] / pantalla.height) : destino[2] / 600;
      const px = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const tam = px * 0.875 * k;
      const puestas = [];
      (op.etiquetas || []).forEach((c) => {
        const e = porClave[c];
        const [x, y] = geo.estados[c].centro;
        const t = el("text", { x, y, class: "at-etiqueta", "font-size": tam.toFixed(2), "text-anchor": "middle" }, capaE);
        el("tspan", { x, dy: 0, class: "at-etq-nombre" }, t).textContent = TEXTOS.atlas.mapa.corto[c] || e.nombre;
        el("tspan", { x, dy: (tam * 1.15).toFixed(2), class: "at-etq-valor" }, t).textContent = TEXTOS.atlas.pct(valor(e));
        acomodar(t, puestas, destino);
      });
      if (op.regiones) {
        atlas.regiones.forEach((r) => {
          const [x, y] = geo.regiones[r.id].centro;
          const t = el("text", { x, y, class: "at-etiqueta at-etq-region", "font-size": (tam * 1.1).toFixed(2), "text-anchor": "middle" }, capaE);
          // Nombres largos en dos renglones: «Golfo y / Península».
          const partes = r.nombre.includes(" y ") ? r.nombre.split(/ (?=y )/) : [r.nombre];
          partes.forEach((parte, i) => {
            el("tspan", { x, dy: i ? (tam * 1.2).toFixed(2) : 0 }, t).textContent = parte;
          });
          acomodar(t, puestas, destino);
        });
      }
      return atlas.estados.filter(enFoco).map((e) => [e.nombre, valor(e)]);
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

    return {
      pintar,
      cajaRegion: (id) => geo.regiones[id].caja,
      alElegir: (fn) => { alElegir = fn; },
      alEnfocar: (fn) => { alEnfocar = fn; },
    };
  }

  return { crear, escala, leyenda };
})();
