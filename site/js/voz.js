/*
 * Lectura en voz alta con la síntesis de voz del navegador (Web Speech API).
 * Está apagada por defecto para no encimarse con los lectores de pantalla.
 */
const Voz = (() => {
  const sintesis = window.speechSynthesis;
  const soportada = Boolean(sintesis && window.SpeechSynthesisUtterance);
  let voz = null;
  let auto = false;
  let botonActivo = null;

  // Prefiere español de México; si no hay, cualquier voz en español.
  function elegirVoz() {
    const voces = sintesis.getVoices();
    voz = voces.find((v) => v.lang === "es-MX")
      || voces.find((v) => v.lang === "es-US")
      || voces.find((v) => v.lang && v.lang.toLowerCase().startsWith("es"))
      || null;
  }

  function marcarBoton(boton, hablando) {
    if (!boton) return;
    const etiqueta = boton.querySelector("span");
    if (!boton.dataset.texto) boton.dataset.texto = etiqueta.textContent;
    etiqueta.textContent = hablando ? "Detener" : boton.dataset.texto;
    boton.classList.toggle("hablando", hablando);
  }

  function detener() {
    if (!soportada) return;
    sintesis.cancel();
    marcarBoton(botonActivo, false);
    botonActivo = null;
  }

  // Chrome corta las lecturas largas: se encola una frase a la vez.
  function frases(texto) {
    return texto
      .replace(/(\d)\s*–\s*(\d)/g, "$1 a $2") // "18–29" se lee "18 a 29"
      .replace(/[«»]/g, "")
      .replace(/\s+/g, " ").split(/(?<=[.!?:])\s+/).filter((f) => f.trim());
  }

  function hablar(texto, boton = null) {
    if (!soportada || !texto) return;
    detener();
    botonActivo = boton;
    marcarBoton(boton, true);
    const partes = frases(texto);
    partes.forEach((f, i) => {
      const u = new SpeechSynthesisUtterance(f);
      u.lang = voz ? voz.lang : "es-MX";
      if (voz) u.voice = voz;
      u.rate = 0.95;
      if (i === partes.length - 1) {
        u.onend = () => {
          if (botonActivo === boton) { marcarBoton(boton, false); botonActivo = null; }
        };
      }
      sintesis.speak(u);
    });
  }

  // Botón "Escuchar": lee, o detiene si ya está leyendo ese mismo texto.
  function alternar(texto, boton) {
    if (botonActivo === boton) detener();
    else hablar(texto, boton);
  }

  // Lectura automática: solo si la persona activó "Voz".
  function anunciar(texto) {
    if (auto) hablar(texto);
  }

  function iniciar({ alActivar }) {
    if (!soportada) return;
    elegirVoz();
    sintesis.addEventListener?.("voiceschanged", elegirVoz);
    document.querySelectorAll(".voz-btn, .escuchar, .voz-aviso").forEach((n) => { n.hidden = false; });
    const conmutador = document.getElementById("voz-auto");
    conmutador.addEventListener("click", () => {
      auto = !auto;
      conmutador.setAttribute("aria-pressed", String(auto));
      if (auto) alActivar();
      else detener();
    });
  }

  return { soportada, iniciar, hablar, alternar, anunciar, detener };
})();
