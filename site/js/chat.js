/*
 * «Pregúntale a Boleta»: botón flotante (abajo a la izquierda, en todas las pantallas) que abre la ventana
 * del chat sobre lo que se esté haciendo, sin perder el avance del juego. Conversación con chat-motor.js.
 * La conversación vive solo en la página (en memoria y en el DOM): no se guarda ni se envía.
 * Con ?entidad=<clave>, el estado de esa edición queda como contexto inicial.
 * Con ?lengua=nah|yua|tzh, la ventana y las respuestas van en esa lengua (chat-lenguas.js, borrador) y
 * Boleta entiende también preguntas en español; una respuesta sin traducir se marca con lang="es".
 */
const Chat = (() => {
  const $ = (s) => document.querySelector(s);
  const T = TEXTOS.chat;
  let motor = null;
  let ctx = null;
  let carga = null;
  let ultima = "";
  const lengua = ChatLenguas[Lengua.clave] || null;

  // Textos fijos de la ventana en la lengua elegida; en español se quedan los de index.html.
  function traducirVentana() {
    if (!lengua) return;
    const u = lengua.ui;
    [$("#chat-abrir"), $("#chat-panel")].forEach((n) => { n.lang = Lengua.clave; });
    $(".chat-flotante-texto").textContent = u.boton;
    $("#t-chat").textContent = u.titulo;
    $(".chat-intro").textContent = u.intro;
    $(".chat-etiqueta").textContent = u.etiqueta;
    $("#chat-entrada").placeholder = u.placeholder;
    $("#chat-form [type=submit]").textContent = u.preguntar;
    $("#chat-escuchar span").textContent = u.escuchar;
    $("#chat-cerrar").setAttribute("aria-label", u.cerrar);
    $("#chat-log").setAttribute("aria-label", u.conversacion);
    $("#chat-sugerencias").setAttribute("aria-label", u.sugeridas);
    const aviso = $("#chat-aviso-lengua");
    aviso.textContent = T.avisoLengua;
    aviso.hidden = false;
  }
  traducirVentana();

  async function cargar() {
    const [chat, atlas, mitos] = await Promise.all(
      ["data/chat.json", "data/atlas.json", "data/mitos.json"].map((u) => fetch(u).then((r) => r.json())),
    );
    // Frases de los mitos y fecha de la próxima elección ya en la lengua de la página (js/lenguas.js).
    const mitosLengua = { ...mitos, niveles: mitos.niveles.map((n) => ({ ...n, mitos: n.mitos.map(Lengua.mito) })),
      proxima_eleccion: { ...mitos.proxima_eleccion, fecha: Lengua.fecha(mitos.proxima_eleccion.fecha) } };
    motor = ChatMotor.crear({ chat, atlas, mitos: mitosLengua, textos: TEXTOS, lengua });
    ctx = motor.nuevoContexto(Datos.entidad && atlas.estados.some((e) => e.clave === Datos.entidad) ? Datos.entidad : null);
    Mascota.poner($("#masc-chat"), "saluda");
    decir(motor.inicio());
  }

  // Un mensaje en la conversación. Siempre con textContent: lo que escribe la persona nunca se interpreta como HTML.
  function mensaje(quien, texto, lang) {
    const div = document.createElement("div");
    div.className = `chat-msg chat-${quien}`;
    if (lang) div.lang = lang;
    const autor = document.createElement("span");
    autor.className = "sr";
    const nombres = { ...T, ...(lengua ? lengua.textos : {}) };
    autor.textContent = `${quien === "tu" ? nombres.tu : nombres.boleta}: `;
    div.append(autor, texto);
    $("#chat-log").appendChild(div);
    $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
  }

  function decir({ texto, sugerencias = [], lang }) {
    mensaje("bot", texto, lang);
    ultima = texto;
    $("#chat-sugerencias").replaceChildren(...sugerencias.map((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chat-sugerencia";
      b.textContent = s;
      // El botón desaparece al cambiar las sugerencias: el foco vuelve al campo de la pregunta.
      b.addEventListener("click", () => { preguntar(s); $("#chat-entrada").focus(); });
      return b;
    }));
    Voz.anunciar(texto);
  }

  function preguntar(texto) {
    const t = texto.trim();
    if (!t || !motor) return;
    mensaje("tu", t);
    const r = motor.responder(t, ctx);
    Mascota.poner($("#masc-chat"), r.intencion ? "saluda" : "piensa");
    decir(r);
  }

  $("#chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const entrada = $("#chat-entrada");
    preguntar(entrada.value);
    entrada.value = "";
    entrada.focus();
  });
  $("#chat-escuchar").addEventListener("click", (e) => Voz.alternar(ultima, e.currentTarget));

  // Ventana modal (dialog): Esc la cierra, el resto de la página queda inactivo y el foco vuelve a quien la abrió.
  const ventana = $("#chat-panel");
  async function abrir() {
    if (!ventana.open) ventana.showModal();
    $("#chat-abrir").setAttribute("aria-expanded", "true");
    try {
      if (!carga) carga = cargar();
      await carga;
    } catch {
      carga = null;
      mensaje("bot", lengua ? lengua.textos.error : T.error);
    }
    $("#chat-entrada").focus();
  }
  function cerrar() {
    if (ventana.open) ventana.close();
  }
  ventana.addEventListener("close", () => {
    Voz.detener();
    $("#chat-abrir").setAttribute("aria-expanded", "false");
  });
  // Tocar fuera del panel (en el fondo) también lo cierra.
  ventana.addEventListener("click", (e) => {
    if (e.target !== ventana) return;
    const r = ventana.getBoundingClientRect();
    const fuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (fuera) cerrar();
  });
  $("#chat-cerrar").addEventListener("click", cerrar);
  $("#chat-abrir").addEventListener("click", abrir);
  document.querySelectorAll("[data-chat]").forEach((b) => b.addEventListener("click", abrir));
  Mascota.poner($("#chat-flotante-masc"), "saluda");

  // En náhuatl, maya o tseltal, Boleta saluda en esa lengua al cargar la página: un globo sobre su botón,
  // la mano y la boca en movimiento. Sin sonido (no hay voces para estas lenguas). Se va solo o al abrir el chat.
  const globo = $("#saludo-lengua");
  function saludar() {
    if (!lengua || document.body.classList.contains("modo-salon")) return;
    const boton = $("#chat-abrir");
    globo.lang = Lengua.clave;
    globo.textContent = lengua.ui.saludo;
    globo.hidden = false;
    Mascota.poner($("#chat-flotante-masc"), "saluda");
    boton.classList.add("saludando");
    setTimeout(() => boton.classList.remove("saludando"), 2400);
    setTimeout(() => { globo.hidden = true; }, 7000);
  }
  ventana.addEventListener("close", () => { globo.hidden = true; });
  $("#chat-abrir").addEventListener("click", () => { globo.hidden = true; });
  setTimeout(saludar, 700);

  // Si la barra fija de «Siguiente pregunta» está a la vista, el botón se sube su alto (crece con A+ y A++).
  const barra = $(".acciones-fijas");
  if (barra && window.ResizeObserver) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty("--chat-elevar", `${barra.offsetHeight}px`);
    }).observe(barra);
  }

  return { abrir, cerrar };
})();
