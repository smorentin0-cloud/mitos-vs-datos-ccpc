/*
 * Lógica del juego "Mitos vs. Datos". Todo el estado vive en memoria (sin localStorage).
 */
(() => {
  const NOMBRES = { cierto: "Cierto", falso: "Falso" };
  const TRAZOS = { bien: "M5 12.5 L10 17.5 L19 7", mal: "M6 6 L18 18 M18 6 L6 18" };
  const $ = (sel) => document.querySelector(sel);
  const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const estado = { mitos: [], totalNiveles: 0, indice: 0, puntos: 0, aciertos: [] };

  function icono(trazo) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${trazo}"/></svg>`;
  }

  // ---------- navegación entre pantallas

  function mostrar(id) {
    Voz.detener();
    document.querySelectorAll(".pantalla").forEach((p) => { p.hidden = p.id !== id; });
    window.scrollTo(0, 0);
    const titulo = document.querySelector(`#${id} h1, #${id} h2`);
    if (titulo) {
      if (!titulo.hasAttribute("tabindex")) titulo.setAttribute("tabindex", "-1");
      titulo.focus({ preventScroll: true });
    }
    if (id === "explora") Explora.abrir();
    if (id === "resultado") Voz.anunciar(textoResultado());
    if (id === "cierre") Voz.anunciar(textoPantalla("cierre"));
  }

  // ---------- textos para leer en voz alta

  function textoPantalla(id) {
    const s = document.getElementById(id);
    return [...s.querySelectorAll("h1, h2, .entrada, .pasos li, .llamado li")]
      .map((n) => n.textContent.trim()).join(". ");
  }

  function textoPregunta() {
    const m = estado.mitos[estado.indice];
    return `Pregunta ${estado.indice + 1} de ${estado.mitos.length}. ${m.enunciado} ` +
      "¿Es cierto o falso? Elige Cierto o Falso.";
  }

  function textoRevelacion() {
    const m = estado.mitos[estado.indice];
    return `${$("#resultado-respuesta").textContent} La respuesta es: ${NOMBRES[m.veredicto]}. ` +
      `${m.explicacion} La gráfica muestra lo siguiente. ${Graficas.describir(m.grafica)} ${m.fuente}`;
  }

  function textoResultado() {
    return `${$("#t-resultado").textContent}. ${$("#mensaje").textContent}`;
  }

  // Al activar "Voz" se lee lo que está en pantalla en ese momento.
  function leerPantallaActual() {
    const visible = [...document.querySelectorAll(".pantalla")].find((p) => !p.hidden);
    if (!visible) return;
    if (visible.id === "juego") {
      Voz.anunciar($("#revelacion").hidden ? textoPregunta() : textoRevelacion());
    } else if (visible.id === "resultado") {
      Voz.anunciar(textoResultado());
    } else {
      Voz.anunciar(textoPantalla(visible.id));
    }
  }

  const LECTURAS = { pregunta: textoPregunta, explicacion: textoRevelacion, resultado: textoResultado };
  document.querySelectorAll(".escuchar").forEach((b) =>
    b.addEventListener("click", () => Voz.alternar(LECTURAS[b.dataset.leer](), b)));

  document.addEventListener("click", (e) => {
    const destino = e.target.closest("[data-ir]");
    if (!destino) return;
    e.preventDefault();
    mostrar(destino.dataset.ir);
  });

  // ---------- tamaño de letra

  document.querySelectorAll(".tamano-btn").forEach((b) => b.addEventListener("click", () => {
    document.documentElement.dataset.tamano = b.dataset.tamano;
    document.querySelectorAll(".tamano-btn").forEach((x) =>
      x.setAttribute("aria-pressed", String(x === b)));
    Graficas.redibujar();
  }));

  // ---------- juego

  function iniciar() {
    if (!estado.mitos.length) return;
    estado.indice = 0;
    estado.puntos = 0;
    estado.aciertos = [];
    $("#casillas").replaceChildren(...estado.mitos.map((_, i) => {
      const li = document.createElement("li");
      li.textContent = i + 1;
      return li;
    }));
    mostrar("juego");
    pintarPregunta();
  }

  function pintarProgreso() {
    [...$("#casillas").children].forEach((li, i) => {
      li.className = i < estado.aciertos.length ? (estado.aciertos[i] ? "bien" : "mal")
        : i === estado.indice ? "actual" : "";
    });
    const total = estado.mitos.length;
    $("#contador").textContent =
      `Pregunta ${estado.indice + 1} de ${total}. Aciertos: ${estado.puntos}.`;
  }

  function pintarPregunta() {
    const m = estado.mitos[estado.indice];
    $("#nivel").textContent = `Nivel ${m.nivel} de ${estado.totalNiveles}: ${m.nombreNivel}`;
    $("#t-mito").textContent = m.enunciado;
    document.querySelectorAll(".opcion").forEach((b) => {
      b.disabled = false;
      b.classList.remove("elegida");
      b.removeAttribute("aria-pressed");
      b.querySelector(".casilla").classList.remove("marcada");
    });
    $("#sello").hidden = true;
    $("#revelacion").hidden = true;
    pintarProgreso();
    window.scrollTo(0, 0);
    $("#t-mito").focus({ preventScroll: true });
    Voz.anunciar(textoPregunta());
  }

  function responder(respuesta) {
    const m = estado.mitos[estado.indice];
    const acerto = respuesta === m.veredicto;
    if (acerto) estado.puntos += 1;
    estado.aciertos.push(acerto);

    document.querySelectorAll(".opcion").forEach((b) => {
      b.disabled = true;
      if (b.dataset.respuesta === respuesta) {
        b.classList.add("elegida");
        b.setAttribute("aria-pressed", "true");
        b.querySelector(".casilla").classList.add("marcada");
      }
    });

    // Sello con la respuesta correcta sobre la boleta.
    $("#sello-texto").textContent = NOMBRES[m.veredicto];
    $("#sello-trazo").setAttribute("d", m.veredicto === "cierto" ? TRAZOS.bien : TRAZOS.mal);
    const sello = $("#sello");
    sello.hidden = true;
    void sello.offsetWidth; // reinicia la animación
    sello.hidden = false;

    const aviso = $("#resultado-respuesta");
    aviso.className = `resultado-respuesta ${acerto ? "acierto" : "fallo"}`;
    aviso.innerHTML = icono(acerto ? TRAZOS.bien : TRAZOS.mal);
    aviso.append(acerto
      ? "¡Acertaste! Sumas 1 punto."
      : `No esta vez. Marcaste «${NOMBRES[respuesta]}».`);

    $("#t-veredicto").textContent = `La respuesta es: ${NOMBRES[m.veredicto]}`;
    const g = m.grafica;
    $("#g-titulo").textContent = g.titulo;
    $("#g-fuente").textContent = m.fuente;
    $("#g-nota").hidden = !g.nota;
    $("#g-nota").textContent = g.nota || "";
    $("#g-tabla").replaceChildren(Graficas.tabla(g));
    $("#explicacion").textContent = m.explicacion;
    $("#siguiente").textContent =
      estado.indice === estado.mitos.length - 1 ? "Ver mi resultado" : "Siguiente pregunta";

    pintarProgreso();
    $("#contador").textContent =
      `Pregunta ${estado.indice + 1} de ${estado.mitos.length}. Aciertos: ${estado.puntos}.`;

    // Se lee dentro del clic: algunos navegadores solo permiten hablar como respuesta a una acción.
    Voz.anunciar(textoRevelacion());

    // Primero se ve el sello; luego baja a la explicación.
    setTimeout(() => {
      $("#revelacion").hidden = false;
      Graficas.dibujar($("#g-lienzo"), g);
      $("#t-veredicto").focus({ preventScroll: true });
      aviso.scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "start" });
    }, sinMovimiento() ? 0 : 700);
  }

  function siguiente() {
    if (estado.indice < estado.mitos.length - 1) {
      estado.indice += 1;
      pintarPregunta();
    } else {
      pintarResultado();
    }
  }

  // ---------- resultado

  function mensaje(puntos, total) {
    if (puntos === total) return "¡Todas bien! Los mitos no pueden contigo. Ahora reta a alguien más.";
    if (puntos >= total - 2) return "¡Muy bien! Conoces cómo vota México.";
    if (puntos >= total / 2) return "Vas bien. Algunos mitos todavía te engañaron.";
    return "Los mitos te ganaron esta vez, pero ahora ya conoces los datos.";
  }

  function fraseReto(puntos, total) {
    return `Acerté ${puntos} de ${total} sobre cómo vota México. ¿Puedes superarme?`;
  }

  function pintarResultado() {
    const total = estado.mitos.length;
    $("#t-resultado").textContent = `Acertaste ${estado.puntos} de ${total}`;
    $("#mensaje").textContent = mensaje(estado.puntos, total);
    $("#resumen").replaceChildren(...estado.mitos.map((m, i) => {
      const li = document.createElement("li");
      const ok = estado.aciertos[i];
      li.innerHTML = `<span class="marca-resumen ${ok ? "bien" : ""}">${icono(ok ? TRAZOS.bien : TRAZOS.mal)}</span>`;
      const txt = document.createElement("span");
      txt.textContent = `${m.enunciado} Respuesta: ${NOMBRES[m.veredicto]}. ${ok ? "Acertaste." : "Fallaste."}`;
      li.appendChild(txt);
      return li;
    }));
    $("#aviso-compartir").textContent = "";
    mostrar("resultado");
    dibujarTarjeta();
  }

  function urlJuego() {
    return location.origin + location.pathname.replace(/index\.html$/, "");
  }

  function envolver(ctx, txt, ancho) {
    const lineas = [];
    let actual = "";
    txt.split(" ").forEach((p) => {
      const prueba = actual ? `${actual} ${p}` : p;
      if (ctx.measureText(prueba).width > ancho && actual) {
        lineas.push(actual);
        actual = p;
      } else {
        actual = prueba;
      }
    });
    if (actual) lineas.push(actual);
    return lineas;
  }

  // Tarjeta 1080 x 1350 con forma de boleta.
  async function dibujarTarjeta() {
    const c = $("#tarjeta");
    const ctx = c.getContext("2d");
    const W = c.width;
    const H = c.height;
    const F = "Lexend, \"Segoe UI\", system-ui, sans-serif";
    try { await Promise.all([document.fonts.load("700 40px Lexend"), document.fonts.load("400 40px Lexend")]); } catch { /* usa la fuente de respaldo */ }
    const total = estado.mitos.length;
    const C = { tinta: "#1F2937", suave: "#4B5563", azul: "#2563EB", base: "#E5E7EB", ambar: "#D97706", gris: "#6B7280", perf: "#9CA3AF" };

    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, W, H);

    // Hoja
    const x0 = 80, y0 = 90, w = W - 160, h = H - 180;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x0, y0, w, h);
    ctx.lineWidth = 6;
    ctx.strokeStyle = C.tinta;
    ctx.strokeRect(x0, y0, w, h);
    ctx.setLineDash([18, 14]);
    ctx.strokeStyle = C.perf;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 150);
    ctx.lineTo(x0 + w, y0 + 150);
    ctx.stroke();
    ctx.setLineDash([]);

    const izq = x0 + 70;
    ctx.textAlign = "left";
    ctx.fillStyle = C.tinta;
    ctx.font = `700 64px ${F}`;
    ctx.fillText("Mitos vs. Datos", izq, y0 + 95);

    ctx.fillStyle = C.suave;
    ctx.font = `400 40px ${F}`;
    ctx.fillText("Mi resultado", izq, y0 + 260);

    ctx.fillStyle = C.tinta;
    ctx.font = `700 230px ${F}`;
    ctx.fillText(`${estado.puntos} de ${total}`, izq - 8, y0 + 480);

    // Casillas marcadas, una por pregunta
    const lado = 76, sep = 22;
    estado.aciertos.forEach((ok, i) => {
      const x = izq + i * (lado + sep);
      const y = y0 + 560;
      ctx.lineWidth = 6;
      ctx.strokeStyle = ok ? C.azul : C.gris;
      ctx.fillStyle = ok ? C.azul : "#FFFFFF";
      ctx.fillRect(x, y, lado, lado);
      ctx.strokeRect(x, y, lado, lado);
      ctx.strokeStyle = ok ? "#FFFFFF" : C.gris;
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (ok) {
        ctx.moveTo(x + 18, y + 40); ctx.lineTo(x + 32, y + 55); ctx.lineTo(x + 58, y + 22);
      } else {
        ctx.moveTo(x + 22, y + 22); ctx.lineTo(x + 54, y + 54);
        ctx.moveTo(x + 54, y + 22); ctx.lineTo(x + 22, y + 54);
      }
      ctx.stroke();
    });

    ctx.fillStyle = C.tinta;
    ctx.font = `700 54px ${F}`;
    envolver(ctx, fraseReto(estado.puntos, total), w - 140).forEach((l, i) => {
      ctx.fillText(l, izq, y0 + 780 + i * 70);
    });

    // Sello
    ctx.save();
    ctx.translate(x0 + w - 165, y0 + 78);
    ctx.rotate(-0.1);
    ctx.strokeStyle = C.ambar;
    ctx.lineWidth = 6;
    ctx.strokeRect(-125, -42, 250, 84);
    ctx.lineWidth = 3;
    ctx.strokeRect(-114, -31, 228, 62);
    ctx.fillStyle = C.ambar;
    ctx.textAlign = "center";
    ctx.font = `700 30px ${F}`;
    ctx.fillText("¿MITO O DATO?", 0, 11);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = C.azul;
    ctx.font = `700 34px ${F}`;
    ctx.fillText(urlJuego().replace(/^https?:\/\//, ""), izq, y0 + h - 130);
    ctx.fillStyle = C.suave;
    ctx.font = `400 26px ${F}`;
    envolver(ctx, "Datos: INE, Conteos Censales de Participación Ciudadana 2009–2024", w - 140)
      .forEach((l, i) => ctx.fillText(l, izq, y0 + h - 84 + i * 36));

    c.setAttribute("aria-label",
      `Tarjeta de resultado: ${estado.puntos} de ${total} respuestas correctas. ${fraseReto(estado.puntos, total)}`);
  }

  function blobTarjeta() {
    return new Promise((ok) => $("#tarjeta").toBlob(ok, "image/png"));
  }

  async function descargar() {
    const blob = await blobTarjeta();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mitos-vs-datos-resultado.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("#aviso-compartir").textContent = "Tarjeta descargada.";
  }

  async function compartir() {
    const datos = { title: "Mitos vs. Datos", text: fraseReto(estado.puntos, estado.mitos.length), url: urlJuego() };
    try {
      const archivo = new File([await blobTarjeta()], "mitos-vs-datos-resultado.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ ...datos, files: [archivo] });
      } else if (navigator.share) {
        await navigator.share(datos);
      } else {
        await copiar();
      }
    } catch (err) {
      if (err.name !== "AbortError") await copiar();
    }
  }

  async function copiar() {
    const url = urlJuego();
    const aviso = $("#aviso-compartir");
    try {
      await navigator.clipboard.writeText(url);
      aviso.textContent = "Enlace copiado. Pégalo donde quieras.";
    } catch {
      aviso.textContent = `Copia este enlace: ${url}`;
    }
  }

  // ---------- arranque

  async function cargar() {
    const resp = await fetch("data/mitos.json");
    const datos = await resp.json();
    estado.totalNiveles = datos.niveles.length;
    estado.mitos = datos.niveles.flatMap((n, i) =>
      n.mitos.map((m) => ({ ...m, nivel: i + 1, nombreNivel: n.nombre })));
    $("#nota-metodo").textContent = datos.nota_metodo;
  }

  Voz.iniciar({ alActivar: leerPantallaActual });
  $("#iniciar").addEventListener("click", iniciar);
  $("#otra-vez").addEventListener("click", iniciar);
  $("#siguiente").addEventListener("click", siguiente);
  $("#descargar").addEventListener("click", descargar);
  $("#compartir").addEventListener("click", compartir);
  $("#copiar").addEventListener("click", copiar);
  document.querySelectorAll(".opcion").forEach((b) =>
    b.addEventListener("click", () => responder(b.dataset.respuesta)));

  cargar().catch(() => {
    $("#portada .entrada").textContent = "No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.";
  });
})();
