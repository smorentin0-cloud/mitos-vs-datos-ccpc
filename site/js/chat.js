/*
 * Pantalla «Pregúntale a Boleta»: conversación con el motor de chat-motor.js.
 * La conversación vive solo en la página (en memoria y en el DOM): no se guarda ni se envía.
 * Con ?entidad=<clave>, el estado de esa edición queda como contexto inicial.
 */
const Chat = (() => {
  const $ = (s) => document.querySelector(s);
  const T = TEXTOS.chat;
  let motor = null;
  let ctx = null;
  let carga = null;
  let ultima = "";

  async function cargar() {
    const [chat, atlas, mitos] = await Promise.all(
      ["data/chat.json", "data/atlas.json", "data/mitos.json"].map((u) => fetch(u).then((r) => r.json())),
    );
    motor = ChatMotor.crear({ chat, atlas, mitos, textos: TEXTOS });
    ctx = motor.nuevoContexto(Datos.entidad && atlas.estados.some((e) => e.clave === Datos.entidad) ? Datos.entidad : null);
    Mascota.poner($("#masc-chat"), "saluda");
    decir(motor.inicio());
  }

  // Un mensaje en la conversación. Siempre con textContent: lo que escribe la persona nunca se interpreta como HTML.
  function mensaje(quien, texto) {
    const div = document.createElement("div");
    div.className = `chat-msg chat-${quien}`;
    const autor = document.createElement("span");
    autor.className = "sr";
    autor.textContent = `${quien === "tu" ? T.tu : T.boleta}: `;
    div.append(autor, texto);
    $("#chat-log").appendChild(div);
    $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
  }

  function decir({ texto, sugerencias = [] }) {
    mensaje("bot", texto);
    ultima = texto;
    $("#chat-sugerencias").replaceChildren(...sugerencias.map((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chat-sugerencia";
      b.textContent = s;
      b.addEventListener("click", () => preguntar(s));
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

  async function abrir() {
    try {
      if (!carga) carga = cargar();
      await carga;
    } catch {
      carga = null;
      mensaje("bot", T.error);
    }
  }

  return { abrir };
})();
