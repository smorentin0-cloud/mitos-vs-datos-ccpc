/*
 * Lógica del juego "Mitos vs. Datos". Todo el estado vive en memoria (sin localStorage).
 */
(() => {
  const NOMBRES = { cierto: "Cierto", falso: "Falso" };
  const $ = (sel) => document.querySelector(sel);

  const estado = { mitos: [], totalNiveles: 0, indice: 0, puntos: 0, aciertos: [] };

  // ---------- navegación entre pantallas

  function mostrar(id) {
    document.querySelectorAll(".pantalla").forEach((p) => { p.hidden = p.id !== id; });
    $("#marcador").hidden = !(id === "juego");
    window.scrollTo(0, 0);
    const titulo = document.querySelector(`#${id} h1, #${id} h2`);
    if (titulo) {
      if (!titulo.hasAttribute("tabindex")) titulo.setAttribute("tabindex", "-1");
      titulo.focus({ preventScroll: true });
    }
    if (id === "explora") Explora.abrir();
  }

  document.addEventListener("click", (e) => {
    const destino = e.target.closest("[data-ir]");
    if (destino) mostrar(destino.dataset.ir);
  });

  // ---------- juego

  function iniciar() {
    if (!estado.mitos.length) return;
    estado.indice = 0;
    estado.puntos = 0;
    estado.aciertos = [];
    mostrar("juego");
    pintarPregunta();
  }

  function actualizarMarcador() {
    $("#marcador").textContent = `${estado.puntos} ${estado.puntos === 1 ? "punto" : "puntos"}`;
  }

  function pintarPregunta() {
    const m = estado.mitos[estado.indice];
    const total = estado.mitos.length;
    $("#nivel").textContent = `Nivel ${m.nivel} de ${estado.totalNiveles} · ${m.nombreNivel}`;
    $("#contador").textContent = `Pregunta ${estado.indice + 1} de ${total}`;
    $("#avance").style.width = `${(100 * estado.indice) / total}%`;
    $("#t-mito").textContent = m.enunciado;
    document.querySelectorAll(".opcion").forEach((b) => {
      b.disabled = false;
      b.classList.remove("elegida", "correcta");
      b.removeAttribute("aria-pressed");
    });
    $("#revelacion").hidden = true;
    actualizarMarcador();
    $("#t-mito").focus({ preventScroll: true });
    window.scrollTo(0, 0);
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
      }
      if (b.dataset.respuesta === m.veredicto) b.classList.add("correcta");
    });

    const aviso = $("#resultado-respuesta");
    aviso.className = `resultado-respuesta ${acerto ? "acierto" : "fallo"}`;
    aviso.textContent = acerto
      ? "¡Acertaste! Sumas 1 punto."
      : `Esta vez no. Tú dijiste «${NOMBRES[respuesta]}».`;

    const veredicto = $("#t-veredicto");
    veredicto.textContent = "Veredicto de los datos: ";
    const sello = document.createElement("span");
    sello.className = "sello";
    sello.textContent = NOMBRES[m.veredicto];
    veredicto.appendChild(sello);

    const g = m.grafica;
    $("#g-titulo").textContent = g.titulo;
    $("#g-fuente").textContent = m.fuente;
    $("#g-nota").hidden = !g.nota;
    $("#g-nota").textContent = g.nota || "";
    $("#g-tabla").replaceChildren(Graficas.tabla(g));
    $("#explicacion").textContent = m.explicacion;
    $("#siguiente").textContent = estado.indice === estado.mitos.length - 1 ? "Ver mi resultado" : "Siguiente";

    $("#revelacion").hidden = false;
    $("#avance").style.width = `${(100 * (estado.indice + 1)) / estado.mitos.length}%`;
    actualizarMarcador();
    Graficas.dibujar($("#g-lienzo"), g);
    veredicto.focus({ preventScroll: true });
    $("#resultado-respuesta").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
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
    if (puntos === total) return "¡Perfecto! Los mitos no pueden contigo. Ahora reta a alguien más.";
    if (puntos >= total - 2) return "¡Muy bien! Conoces bien cómo vota México.";
    if (puntos >= total / 2) return "Vas por buen camino. Algunos mitos todavía te engañaron.";
    return "Los mitos te ganaron esta vez, pero ahora ya conoces los datos.";
  }

  function frasesReto(puntos, total) {
    return `Acerté ${puntos} de ${total} sobre cómo vota México. ¿Mito o dato? ¿Puedes superarme?`;
  }

  function pintarResultado() {
    const total = estado.mitos.length;
    $("#t-resultado").textContent = `Acertaste ${estado.puntos} de ${total}`;
    $("#mensaje").textContent = mensaje(estado.puntos, total);
    const lista = $("#resumen");
    lista.replaceChildren();
    estado.mitos.forEach((m, i) => {
      const li = document.createElement("li");
      const marca = document.createElement("span");
      marca.className = estado.aciertos[i] ? "ok" : "";
      marca.textContent = estado.aciertos[i] ? "✓ Acertaste" : "✗ Fallaste";
      li.append(`«${m.enunciado}» — ${NOMBRES[m.veredicto]}. `, marca);
      lista.appendChild(li);
    });
    $("#aviso-compartir").textContent = "";
    dibujarTarjeta();
    mostrar("resultado");
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

  function dibujarTarjeta() {
    const c = $("#tarjeta");
    const ctx = c.getContext("2d");
    const W = c.width;
    const fuente = getComputedStyle(document.body).fontFamily;
    const total = estado.mitos.length;
    const C = Graficas.COLORES;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, c.height);
    ctx.fillStyle = C.datos;
    ctx.fillRect(0, 0, W, 280);
    ctx.textAlign = "center";

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 84px ${fuente}`;
    ctx.fillText("MITOS vs. DATOS", W / 2, 150);
    ctx.font = `400 42px ${fuente}`;
    ctx.fillText("El juego sobre cómo vota México", W / 2, 220);

    ctx.fillStyle = "#4B5563";
    ctx.font = `700 44px ${fuente}`;
    ctx.fillText("MI RESULTADO", W / 2, 400);

    ctx.fillStyle = "#1F2937";
    ctx.font = `800 240px ${fuente}`;
    ctx.fillText(`${estado.puntos}/${total}`, W / 2, 640);
    ctx.font = `400 48px ${fuente}`;
    ctx.fillText("respuestas correctas", W / 2, 720);

    // Una ficha por mito: llena si acertó, vacía si no.
    const r = 38;
    const sep = 108;
    const x0 = W / 2 - ((total - 1) * sep) / 2;
    estado.aciertos.forEach((ok, i) => {
      const x = x0 + i * sep;
      const y = 840;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      if (ok) {
        ctx.fillStyle = C.datos;
        ctx.fill();
      } else {
        ctx.strokeStyle = C.base;
        ctx.stroke();
      }
      ctx.fillStyle = ok ? "#FFFFFF" : C.base;
      ctx.font = `800 40px ${fuente}`;
      ctx.fillText(ok ? "✓" : "✗", x, y + 14);
    });

    ctx.fillStyle = "#1F2937";
    ctx.font = `700 54px ${fuente}`;
    envolver(ctx, frasesReto(estado.puntos, total), 900).forEach((l, i) => {
      ctx.fillText(l, W / 2, 1000 + i * 70);
    });

    ctx.fillStyle = C.acento;
    ctx.fillRect(W / 2 - 80, 1160, 160, 8);

    ctx.fillStyle = C.datos;
    ctx.font = `700 36px ${fuente}`;
    ctx.fillText(urlJuego().replace(/^https?:\/\//, ""), W / 2, 1230);
    ctx.fillStyle = "#4B5563";
    ctx.font = `400 26px ${fuente}`;
    ctx.fillText("Datos: INE, Conteos Censales de Participación Ciudadana 2009–2024", W / 2, 1290);

    c.setAttribute("aria-label", `Tarjeta de resultado: ${estado.puntos} de ${total} respuestas correctas. ${frasesReto(estado.puntos, total)}`);
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
    const total = estado.mitos.length;
    const datos = { title: "Mitos vs. Datos", text: frasesReto(estado.puntos, total), url: urlJuego() };
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
      aviso.textContent = "Enlace copiado. ¡Pégalo donde quieras!";
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
