/*
 * Lectura en voz alta con la síntesis de voz del navegador (Web Speech API).
 * Está apagada por defecto para no encimarse con los lectores de pantalla.
 * Solo usa voces locales (localService): las voces «en línea» generan el audio en servidores
 * de Microsoft o Google, y lo que se lee puede incluir el estado o la edad de la persona.
 */
const Voz = (() => {
  const sintesis = window.speechSynthesis;
  const soportada = Boolean(sintesis && window.SpeechSynthesisUtterance);
  let voz = null;
  let voces = [];
  let elegidaPorPersona = false;
  let auto = false;
  let botonActivo = null;

  // Mejor voz primero: español de México, luego de EE. UU., luego cualquier español;
  // dentro de cada idioma, las voces de mayor calidad que instalan algunos sistemas.
  const CALIDAD = /natural|neural|premium|enhanced|mejorad|siri|google/i;
  function puntaje(v) {
    const lang = v.lang.toLowerCase().replace("_", "-");
    const idioma = lang === "es-mx" ? 0 : lang === "es-us" || lang === "es-419" ? 1 : 2;
    return idioma * 2 + (CALIDAD.test(v.name) ? 0 : 1);
  }

  function cargarVoces() {
    voces = sintesis.getVoices()
      .filter((v) => v.localService && v.lang && v.lang.toLowerCase().startsWith("es"))
      .sort((a, b) => puntaje(a) - puntaje(b) || a.name.localeCompare(b.name));
    if (!elegidaPorPersona || !voces.includes(voz)) voz = voces[0] || null;
    pintarSelector();
  }

  // «Microsoft Sabina - Spanish (Mexico)» → «Sabina (México)»
  function nombreCorto(v) {
    const nombre = v.name.replace(/^(Microsoft|Google|Apple)\s+/i, "").replace(/\s*[-–(].*$/, "").trim() || v.name;
    const region = TEXTOS.voz.regiones[v.lang.slice(3).toUpperCase()] || v.lang;
    return `${nombre} (${region})`;
  }

  function pintarSelector() {
    const campo = document.getElementById("voz-campo");
    const sel = document.getElementById("voz-elegida");
    if (!campo || !sel) return;
    campo.hidden = voces.length < 2;
    sel.replaceChildren(...voces.map((v, i) => {
      const o = new Option(nombreCorto(v), String(i));
      o.selected = v === voz;
      return o;
    }));
  }

  function marcarBoton(boton, hablando) {
    if (!boton) return;
    const etiqueta = boton.querySelector("span");
    if (!boton.dataset.texto) boton.dataset.texto = etiqueta.textContent;
    etiqueta.textContent = hablando ? TEXTOS.voz.detener : boton.dataset.texto;
    boton.classList.toggle("hablando", hablando);
  }

  // La mascota mueve la boca mientras suena una frase (clase en <html>, la usa estilos.css).
  function boca(abierta) {
    document.documentElement.classList.toggle("voz-hablando", abierta);
  }

  function detener() {
    if (!soportada) return;
    sintesis.cancel();
    boca(false);
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
      u.onstart = () => boca(true);
      u.onend = () => {
        boca(false);
        if (i === partes.length - 1 && botonActivo === boton) { marcarBoton(boton, false); botonActivo = null; }
      };
      u.onerror = () => boca(false);
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
    cargarVoces();
    sintesis.addEventListener?.("voiceschanged", cargarVoces);
    document.querySelectorAll(".voz-btn, .escuchar, .voz-aviso").forEach((n) => { n.hidden = false; });
    const conmutador = document.getElementById("voz-auto");
    conmutador.addEventListener("click", () => {
      auto = !auto;
      conmutador.setAttribute("aria-pressed", String(auto));
      if (auto) alActivar();
      else detener();
    });
    // La voz elegida vive solo en memoria; al cambiarla se escucha una muestra.
    document.getElementById("voz-elegida").addEventListener("change", (e) => {
      voz = voces[Number(e.target.value)] || voz;
      elegidaPorPersona = true;
      hablar(TEXTOS.voz.muestra);
    });
  }

  return { soportada, iniciar, hablar, alternar, anunciar, detener };
})();
