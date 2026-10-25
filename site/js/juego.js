/*
 * Lógica del juego "Mitos vs. Datos". Todo el estado vive en memoria (sin localStorage).
 */
(() => {
  const NOMBRES = { cierto: "Cierto", falso: "Falso" };
  const TRAZOS = { bien: "M5 12.5 L10 17.5 L19 7", mal: "M6 6 L18 18 M18 6 L6 18" };
  const $ = (sel) => document.querySelector(sel);
  const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const estado = {
    mitos: [], totalNiveles: 0, indice: 0, puntos: 0, aciertos: [],
    // Perfil opcional: vive solo en memoria y nunca sale del navegador.
    perfil: { grupo: "", entidad: "" },
    lugar: "México",
    datosPerfil: null,
    textoPerfil: "",
    // Modo salón: una pregunta por pantalla, sin puntos, la persona facilitadora revela.
    salon: false,
    tamanoPrevio: "1",
    revelada: false,
    temporizador: null,
  };

  function icono(trazo) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${trazo}"/></svg>`;
  }

  // ---------- navegación entre pantallas

  function mostrar(id) {
    Voz.detener();
    if (id === "portada" && estado.salon) salirSalon();
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
    return [...s.querySelectorAll("h1, h2, .entrada, .pasos li, .nota-papel, .perfil legend, .perfil-ayuda, .privacidad, .llamado li")]
      .map((n) => n.textContent.trim()).join(". ");
  }

  function textoPregunta() {
    const m = estado.mitos[estado.indice];
    const intro = m.introNivel ? `${m.introNivel} ` : "";
    return `${intro}Pregunta ${estado.indice + 1} de ${estado.mitos.length}. ${m.enunciado} ` +
      (estado.salon ? TEXTOS.salon.votar : "¿Es cierto o falso? Elige Cierto o Falso.");
  }

  function textoRevelacion() {
    const m = estado.mitos[estado.indice];
    const aviso = estado.salon ? "" : `${$("#resultado-respuesta").textContent} `;
    const discusion = estado.salon ? ` ${TEXTOS.salon.paraConversar} ${m.discusion}` : "";
    return `${aviso}La respuesta es: ${NOMBRES[m.veredicto]}. ` +
      `${m.explicacion} La gráfica muestra lo siguiente. ${Graficas.describir(m.grafica)} ${m.fuente}${discusion}`;
  }

  function textoResultado() {
    const g = $("#perfil-g-lienzo").dataset.spec ? JSON.parse($("#perfil-g-lienzo").dataset.spec) : null;
    return `${$("#t-resultado").textContent}. ${$("#mensaje").textContent} ` +
      `${TEXTOS.perfil.titulo} ${$("#perfil-mensaje").textContent} ${$("#perfil-comparacion").textContent} ` +
      (g ? `La gráfica muestra lo siguiente. ${Graficas.describir(g)} ${$("#perfil-g-fuente").textContent}` : "");
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

  function ponerTamano(nivel) {
    document.documentElement.dataset.tamano = nivel;
    document.querySelectorAll(".tamano-btn").forEach((x) =>
      x.setAttribute("aria-pressed", String(x.dataset.tamano === nivel)));
    Graficas.redibujar();
  }

  document.querySelectorAll(".tamano-btn").forEach((b) =>
    b.addEventListener("click", () => ponerTamano(b.dataset.tamano)));

  // ---------- juego

  function iniciar({ conPerfil = true } = {}) {
    if (!estado.mitos.length) return;
    if (estado.salon) salirSalon();
    estado.perfil = conPerfil
      ? { grupo: $("#p-grupo").value, entidad: $("#p-entidad").value }
      : { grupo: "", entidad: "" };
    prepararRecorrido();
    mostrar("juego");
    pintarPregunta();
  }

  function prepararRecorrido() {
    estado.indice = 0;
    estado.puntos = 0;
    estado.aciertos = [];
    $("#casillas").replaceChildren(...estado.mitos.map((_, i) => {
      const li = document.createElement("li");
      li.textContent = i + 1;
      return li;
    }));
  }

  function pintarProgreso() {
    if (estado.salon) {
      [...$("#casillas").children].forEach((li, i) => {
        li.className = i < estado.indice ? "hecho" : i === estado.indice ? "actual" : "";
      });
      $("#contador").textContent = TEXTOS.salon.contador(estado.indice + 1, estado.mitos.length);
      return;
    }
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
    // Texto de transición al empezar cada nivel.
    $("#intro-nivel").hidden = !m.introNivel;
    $("#intro-nivel").textContent = m.introNivel || "";
    document.querySelectorAll(".opcion").forEach((b) => {
      b.disabled = false;
      b.classList.remove("elegida");
      b.removeAttribute("aria-pressed");
      b.querySelector(".casilla").classList.remove("marcada");
    });
    estado.revelada = false;
    clearTimeout(estado.temporizador); // una revelación pendiente no debe caer en otra pregunta
    $("#sello").hidden = true;
    $("#revelacion").hidden = true;
    $("#opciones").hidden = estado.salon;
    $("#salon-votar").hidden = !estado.salon;
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

    const aviso = $("#resultado-respuesta");
    aviso.className = `resultado-respuesta ${acerto ? "acierto" : "fallo"}`;
    aviso.innerHTML = icono(acerto ? TRAZOS.bien : TRAZOS.mal);
    aviso.append(acerto
      ? "¡Acertaste! Sumas 1 punto."
      : `No esta vez. Marcaste «${NOMBRES[respuesta]}».`);
    revelar();
  }

  // Sello, explicación y gráfica. Lo usan el juego y el modo salón.
  function revelar() {
    if (estado.revelada) return;
    estado.revelada = true;
    const m = estado.mitos[estado.indice];
    const aviso = $("#resultado-respuesta");
    aviso.hidden = estado.salon;
    $("#salon-votar").hidden = true;

    // Sello con la respuesta correcta sobre la boleta.
    $("#sello-texto").textContent = NOMBRES[m.veredicto];
    $("#sello-trazo").setAttribute("d", m.veredicto === "cierto" ? TRAZOS.bien : TRAZOS.mal);
    const sello = $("#sello");
    sello.hidden = true;
    void sello.offsetWidth; // reinicia la animación
    sello.hidden = false;

    $("#t-veredicto").textContent = `La respuesta es: ${NOMBRES[m.veredicto]}`;
    const g = m.grafica;
    $("#g-titulo").textContent = g.titulo;
    $("#g-fuente").textContent = m.fuente;
    $("#g-nota").hidden = !g.nota;
    $("#g-nota").textContent = g.nota || "";
    $("#g-tabla").replaceChildren(Graficas.tabla(g));
    $("#explicacion").textContent = m.explicacion;
    $("#discusion").hidden = !estado.salon;
    $("#discusion-texto").textContent = m.discusion || "";
    const ultima = estado.indice === estado.mitos.length - 1;
    $("#siguiente").textContent = estado.salon
      ? (ultima ? TEXTOS.salon.terminar : "Siguiente pregunta")
      : (ultima ? "Ver mi resultado" : "Siguiente pregunta");

    pintarProgreso();

    // Se lee dentro del clic: algunos navegadores solo permiten hablar como respuesta a una acción.
    Voz.anunciar(textoRevelacion());

    // Primero se ve el sello; luego baja a la explicación.
    estado.temporizador = setTimeout(() => {
      $("#revelacion").hidden = false;
      Graficas.dibujar($("#g-lienzo"), g);
      $("#t-veredicto").focus({ preventScroll: true });
      (estado.salon ? $("#t-veredicto") : aviso)
        .scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "start" });
    }, sinMovimiento() ? 0 : 700);
  }

  function siguiente() {
    if (estado.indice < estado.mitos.length - 1) {
      estado.indice += 1;
      pintarPregunta();
    } else if (estado.salon) {
      mostrar("cierre"); // sin tarjeta de puntuación individual
    } else {
      pintarResultado();
    }
  }

  // ---------- modo salón

  function entrarSalon() {
    if (!estado.mitos.length) return;
    estado.salon = true;
    estado.tamanoPrevio = document.documentElement.dataset.tamano || "1";
    document.body.classList.add("modo-salon");
    $("#salir-salon").hidden = false;
    ponerTamano("3");
    prepararRecorrido();
    mostrar("juego");
    pintarPregunta();
  }

  function salirSalon() {
    estado.salon = false;
    document.body.classList.remove("modo-salon");
    $("#salir-salon").hidden = true;
    $("#discusion").hidden = true;
    $("#resultado-respuesta").hidden = false;
    ponerTamano(estado.tamanoPrevio);
  }

  // Avanza como en una presentación: primero revela, luego pasa a la siguiente.
  function avanzarSalon() {
    if (!estado.revelada) revelar();
    else if (!$("#revelacion").hidden) siguiente(); // espera a que termine de revelarse
  }

  function retrocederSalon() {
    if (estado.revelada) {
      pintarPregunta();
    } else if (estado.indice > 0) {
      estado.indice -= 1;
      pintarPregunta();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!estado.salon || $("#juego").hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    const enControl = e.target.closest("button, a, select, input, summary, textarea");
    if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !enControl)) {
      e.preventDefault();
      avanzarSalon();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      retrocederSalon();
    } else if (e.key === "Escape") {
      mostrar("portada");
    }
  });

  // ---------- resultado

  function mensaje(puntos, total) {
    if (puntos === total) return "¡Todas bien! Los mitos no pueden contigo. Ahora reta a alguien más.";
    if (puntos >= total - 2) return `¡Muy bien! Conoces cómo vota ${estado.lugar}.`;
    if (puntos >= total / 2) return "Vas bien. Algunos mitos todavía te engañaron.";
    return "Los mitos te ganaron esta vez, pero ahora ya conoces los datos.";
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
    pintarPerfil();
    mostrar("resultado");
    const g = JSON.parse($("#perfil-g-lienzo").dataset.spec);
    Graficas.dibujar($("#perfil-g-lienzo"), g);
    dibujarTarjeta();
  }

  // ---------- portada según la versión (nacional o de un estado)

  function pintarPortada(datos, respaldo) {
    const P = TEXTOS.portada;
    const total = datos.niveles.reduce((n, nivel) => n + nivel.mitos.length, 0);
    estado.lugar = datos.ambito ? datos.ambito.nombre : "México";
    if (datos.titulo) $("#t-portada").textContent = datos.titulo;
    $("#portada-entrada").textContent = P.entrada(total);
    const edicion = $("#edicion");
    if (datos.ambito && datos.ambito.clave) {
      edicion.textContent = P.edicion(estado.lugar);
      edicion.hidden = false;
      $("#p-entidad").value = String(datos.ambito.clave); // el perfil empieza en ese estado
    } else if (respaldo) {
      edicion.textContent = P.sinEdicion;
      edicion.hidden = false;
    }
    document.querySelectorAll(".enlace-imprimible").forEach((a) => { a.href = Datos.conEntidad("imprimible.html"); });
  }

  // ---------- final personalizado

  function llenarPerfil() {
    const { edad, entidades } = estado.datosPerfil;
    const T = TEXTOS.perfil;
    const opcion = (valor, texto) => `<option value="${valor}">${texto}</option>`;
    $("#p-grupo").innerHTML = opcion("", T.noDecir) + opcion("menor", T.menor) +
      edad.grupos.map((g, i) => opcion(i, T.grupoLegible(g))).join("");
    $("#p-entidad").innerHTML = opcion("", T.noDecir) +
      entidades.entidades.map((e) => opcion(e.clave, e.nombre)).join("");
  }

  // Arma el mensaje, la comparación y la gráfica con datos reales del año más reciente.
  function pintarPerfil() {
    const T = TEXTOS.perfil;
    const { edad, entidades } = estado.datosPerfil;
    const anio = String(Math.max(...edad.anios));
    const { grupo, entidad } = estado.perfil;
    const menor = grupo === "menor";
    const iGrupo = menor ? 0 : grupo === "" ? null : Number(grupo);
    const iEnt = entidad === "" ? null : entidades.entidades.findIndex((e) => String(e.clave) === entidad);
    const nombreEnt = iEnt === null ? null : entidades.entidades[iEnt].nombre;
    const pais = entidades.nacional[anio];
    const r = T.deCada100;

    let valor;
    let items;
    let titulo = T.graficaTitulo(anio);
    let comparacion;
    const grupoTxt = iGrupo === null ? null : T.grupoLegible(edad.grupos[iGrupo]);

    if (iGrupo !== null && iEnt !== null) {
      valor = edad.datos[anio][entidad][iGrupo];
      const promEnt = entidades.participacion[anio][iEnt];
      comparacion = T.comparaEstado(nombreEnt, r(promEnt), r(pais));
      items = [
        { etiqueta: T.etiquetaGrupoLugar(grupoTxt, nombreEnt), valor, color: "datos" },
        { etiqueta: T.todo(nombreEnt), valor: promEnt, color: "base" },
        { etiqueta: T.todoPais, valor: pais, color: "base" },
      ];
    } else if (iGrupo !== null) {
      valor = edad.datos[anio]["0"][iGrupo];
      comparacion = T.comparaPais(r(pais));
      items = [
        { etiqueta: T.etiquetaGrupoLugar(grupoTxt, T.pais), valor, color: "datos" },
        { etiqueta: T.todoPais, valor: pais, color: "base" },
      ];
    } else if (iEnt !== null) {
      valor = entidades.participacion[anio][iEnt];
      comparacion = T.comparaPais(r(pais));
      items = [
        { etiqueta: T.todo(nombreEnt), valor, color: "datos" },
        { etiqueta: T.todoPais, valor: pais, color: "base" },
      ];
    } else {
      // Sin datos de la persona: el dato del país y cómo votó cada grupo de edad.
      valor = pais;
      comparacion = T.contexto;
      titulo = T.graficaGrupos(anio);
      items = edad.grupos.map((g, i) => ({
        etiqueta: T.grupoLegible(g), valor: edad.datos[anio]["0"][i], color: "datos",
      }));
    }

    const mensajePerfil = T.mensaje({
      lugar: nombreEnt || T.pais, grupo: grupoTxt, valor: r(valor), anio, menor,
    });
    estado.textoPerfil = mensajePerfil;
    $("#perfil-mensaje").textContent = mensajePerfil;
    $("#perfil-comparacion").textContent = comparacion;
    const spec = { tipo: "barras", titulo, items };
    $("#perfil-g-titulo").textContent = titulo;
    $("#perfil-g-fuente").textContent = T.fuente(anio);
    $("#perfil-g-tabla").replaceChildren(Graficas.tabla(spec));
    $("#perfil-g-lienzo").dataset.spec = JSON.stringify(spec);
  }

  // Dirección para compartir; conserva la versión estatal (?entidad=6) si se está jugando una.
  function urlJuego() {
    return location.origin + Datos.conEntidad(location.pathname.replace(/index\.html$/, ""));
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

  function cargarImagen(src) {
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => ok(null);
      img.src = src;
    });
  }

  // Tarjeta 1080 x 1350 con forma de boleta: marcador, dato personalizado, reto y código QR.
  async function dibujarTarjeta() {
    const T = TEXTOS.tarjeta;
    const c = $("#tarjeta");
    const ctx = c.getContext("2d");
    const W = c.width;
    const H = c.height;
    const F = "Lexend, \"Segoe UI\", system-ui, sans-serif";
    try { await Promise.all([document.fonts.load("700 40px Lexend"), document.fonts.load("400 40px Lexend")]); } catch { /* usa la fuente de respaldo */ }
    const qr = await cargarImagen("img/qr.png");
    const total = estado.mitos.length;
    const anios = estado.datosPerfil.edad.anios;
    const C = { tinta: "#1F2937", suave: "#4B5563", azul: "#2563EB", ambar: "#D97706", gris: "#6B7280", perf: "#9CA3AF" };

    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, W, H);

    // Hoja con talón perforado
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
    const anchoTexto = w - 140;
    ctx.textAlign = "left";
    ctx.fillStyle = C.tinta;
    ctx.font = `700 64px ${F}`;
    ctx.fillText(T.marca, izq, y0 + 95);

    ctx.fillStyle = C.suave;
    ctx.font = `400 40px ${F}`;
    ctx.fillText(T.miResultado, izq, y0 + 240);

    ctx.fillStyle = C.tinta;
    ctx.font = `700 200px ${F}`;
    ctx.fillText(T.marcador(estado.puntos, total), izq - 8, y0 + 430);

    // Casillas marcadas, una por pregunta
    const lado = 70, sep = 20;
    estado.aciertos.forEach((ok, i) => {
      const x = izq + i * (lado + sep);
      const y = y0 + 480;
      ctx.lineWidth = 6;
      ctx.strokeStyle = ok ? C.azul : C.gris;
      ctx.fillStyle = ok ? C.azul : "#FFFFFF";
      ctx.fillRect(x, y, lado, lado);
      ctx.strokeRect(x, y, lado, lado);
      ctx.strokeStyle = ok ? "#FFFFFF" : C.gris;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (ok) {
        ctx.moveTo(x + 17, y + 37); ctx.lineTo(x + 30, y + 51); ctx.lineTo(x + 54, y + 20);
      } else {
        ctx.moveTo(x + 20, y + 20); ctx.lineTo(x + 50, y + 50);
        ctx.moveTo(x + 50, y + 20); ctx.lineTo(x + 20, y + 50);
      }
      ctx.stroke();
    });

    // Dato personalizado (o el del país si la persona prefirió no decir)
    ctx.fillStyle = C.suave;
    ctx.font = `400 32px ${F}`;
    ctx.fillText(T.perfil, izq, y0 + 640);
    ctx.fillStyle = C.tinta;
    ctx.font = `700 42px ${F}`;
    envolver(ctx, estado.textoPerfil, anchoTexto).slice(0, 4).forEach((l, i) => {
      ctx.fillText(l, izq, y0 + 700 + i * 56);
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
    ctx.fillText(T.sello, 0, 11);
    ctx.restore();

    // Reto y código QR al pie
    const ladoQr = 230;
    const xQr = x0 + w - 60 - ladoQr;
    const yQr = y0 + h - 60 - ladoQr;
    if (qr) ctx.drawImage(qr, xQr, yQr, ladoQr, ladoQr);
    ctx.textAlign = "left";
    ctx.fillStyle = C.tinta;
    ctx.font = `700 64px ${F}`;
    ctx.fillText(T.meGanas, izq, yQr + 50);
    ctx.font = `400 30px ${F}`;
    ctx.fillText(T.juegaEn, izq, yQr + 100);
    // La dirección se parte después del dominio para que quepa junto al QR.
    const url = urlJuego().replace(/^https?:\/\//, "");
    const corte = url.indexOf("/") + 1;
    ctx.fillStyle = C.azul;
    ctx.font = `700 30px ${F}`;
    [url.slice(0, corte), url.slice(corte)].filter(Boolean)
      .forEach((l, i) => ctx.fillText(l, izq, yQr + 142 + i * 38));
    ctx.fillStyle = C.suave;
    ctx.font = `400 24px ${F}`;
    if (qr) ctx.fillText(T.qr, izq, yQr + 230);
    ctx.textAlign = "center";
    envolver(ctx, T.fuente(anios[0], anios.at(-1)), w - 80)
      .forEach((l, i) => ctx.fillText(l, x0 + w / 2, y0 + h + 50 + i * 30));

    c.setAttribute("aria-label", T.descripcion(estado.puntos, total, estado.textoPerfil));
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
    $("#aviso-compartir").textContent = TEXTOS.compartir.descargada;
  }

  async function compartir() {
    const C = TEXTOS.compartir;
    const datos = { title: C.titulo, text: C.reto(estado.puntos, estado.mitos.length, estado.lugar), url: urlJuego() };
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

  // Copia el reto completo con el enlace, no solo la dirección.
  async function copiar() {
    const C = TEXTOS.compartir;
    const texto = C.retoConEnlace(estado.puntos, estado.mitos.length, estado.lugar, urlJuego());
    const aviso = $("#aviso-compartir");
    try {
      await navigator.clipboard.writeText(texto);
      aviso.textContent = C.copiado;
    } catch {
      aviso.textContent = C.copiaManual(texto);
    }
  }

  // ---------- arranque

  async function cargar() {
    const [{ datos, respaldo }, edad, entidades] = await Promise.all([
      Datos.mitos(),
      ...["data/explora.json", "data/entidades.json"].map((u) => fetch(u).then((r) => r.json())),
    ]);
    estado.datosPerfil = { edad, entidades };
    llenarPerfil();
    pintarPortada(datos, respaldo);
    estado.totalNiveles = datos.niveles.length;
    estado.mitos = datos.niveles.flatMap((n, i) =>
      n.mitos.map((m, j) => ({ ...m, nivel: i + 1, nombreNivel: n.nombre, introNivel: j === 0 ? n.intro : "" })));
    if (datos.cierre) {
      $("#t-cierre").textContent = datos.cierre.titulo;
      $("#cierre-texto").textContent = datos.cierre.texto;
    }
    $("#nota-metodo").textContent = datos.nota_metodo;
  }

  Voz.iniciar({ alActivar: leerPantallaActual });
  $("#iniciar").addEventListener("click", () => iniciar());
  $("#entrar-salon").addEventListener("click", entrarSalon);
  $("#salir-salon").addEventListener("click", () => mostrar("portada"));
  $("#revelar").addEventListener("click", revelar);
  $("#saltar").addEventListener("click", () => iniciar({ conPerfil: false }));
  // "Jugar otra vez" conserva el perfil que se haya elegido.
  $("#otra-vez").addEventListener("click", () => iniciar());
  $("#siguiente").addEventListener("click", siguiente);
  $("#descargar").addEventListener("click", descargar);
  $("#compartir").addEventListener("click", compartir);
  $("#copiar").addEventListener("click", copiar);
  document.querySelectorAll(".opcion").forEach((b) =>
    b.addEventListener("click", () => responder(b.dataset.respuesta)));

  // Guarda el sitio para usarlo sin conexión (no guarda nada de la persona).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  cargar().catch(() => {
    $("#portada .entrada").textContent = "No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.";
  });
})();
