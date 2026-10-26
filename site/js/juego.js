/*
 * Lógica del juego "Mitos vs. Datos". Todo el estado vive en memoria (sin localStorage).
 */
(() => {
  const NOMBRES = TEXTOS.veredictos;
  const J = TEXTOS.juego;
  const TRAZOS = { bien: "M5 12.5 L10 17.5 L19 7", mal: "M6 6 L18 18 M18 6 L6 18" };
  const $ = (sel) => document.querySelector(sel);
  const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const estado = {
    mitos: [], totalNiveles: 0, indice: 0, puntos: 0, aciertos: [],
    // Perfil opcional: vive solo en memoria y nunca sale del navegador.
    // edad: número o null; entidad: clave o null; local/pais: personal.json cargados.
    perfil: { edad: null, entidad: null, nombre: null, local: null, pais: null, municipio: null },
    municipiosEstado: null, // lista del estado elegido en el perfil
    proxima: null,
    aniosHistoria: [],
    lugar: "México",
    ambitoClave: 0,
    caso: null, // «Y en tu caso…» de la pregunta actual
    // «Adivina antes de ver»: fase de la pregunta ("estimar" o "votar") y estimaciones de la partida.
    fase: "votar",
    estimacion: null,
    estimaciones: [],
    personalAmbito: null, // personal.json del ámbito del juego (país o estado de la versión)
    compromiso: null, // clave del compromiso elegido en el cierre
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
    if (id === "cierre") {
      $("#compromiso").hidden = estado.salon || !estado.aciertos.length;
      Voz.anunciar(textoPantalla("cierre"));
    }
  }

  // ---------- textos para leer en voz alta

  function textoPantalla(id) {
    const s = document.getElementById(id);
    return [...s.querySelectorAll("h1, h2, h3:not([hidden] *), .entrada, .pasos li, .nota-papel, .campo-titulo, .ayuda, .privacidad, .llamado li, .reto-aviso:not([hidden])")]
      .map((n) => n.textContent.trim()).join(". ");
  }

  function textoPregunta() {
    const m = estado.mitos[estado.indice];
    const intro = m.introNivel ? `${m.introNivel} ` : "";
    const cierre = estado.fase === "estimar" ? $("#est-pregunta").textContent
      : (estado.salon ? TEXTOS.salon.votar : J.cierto_o_falso);
    return `${intro}${J.pregunta(estado.indice + 1, estado.mitos.length)} ${m.enunciado} ${cierre}`;
  }

  function textoRevelacion() {
    const m = estado.mitos[estado.indice];
    const aviso = estado.salon ? "" : `${$("#resultado-respuesta").textContent} `;
    const discusion = estado.salon ? ` ${TEXTOS.salon.paraConversar} ${m.discusion}` : "";
    const caso = estado.caso
      ? ` ${TEXTOS.enTuCaso.titulo} ${estado.caso.texto}` +
        (estado.caso.grafica ? ` ${J.graficaMuestra} ${Graficas.describir(estado.caso.grafica)} ${estado.caso.fuente}` : "")
      : "";
    return `${aviso}${J.respuesta(NOMBRES[m.veredicto])}. ` +
      `${m.explicacion} ${J.graficaMuestra} ${Graficas.describir(m.grafica)} ${m.fuente}${discusion}${caso}`;
  }

  function textoResultado() {
    const g = $("#perfil-g-lienzo").dataset.spec ? JSON.parse($("#perfil-g-lienzo").dataset.spec) : null;
    const est = $("#estimaciones").hidden ? "" : `${$("#t-estimaciones").textContent}. ${$("#est-resumen").textContent} `;
    const hist = $("#historia").hidden ? ""
      : `${$("#t-historia").textContent}. ${$("#historia-intro").textContent} ${[...$("#historia-lista").children].map((li) => li.textContent.trim()).join(" ")} `;
    return `${$("#t-resultado").textContent}. ${$("#mensaje").textContent} ${est}` +
      `${TEXTOS.perfil.titulo} ${$("#perfil-mensaje").textContent} ${$("#perfil-comparacion").textContent} ` +
      ($("#perfil-municipio").hidden ? "" : `${$("#perfil-municipio").textContent} `) +
      (g ? `${J.graficaMuestra} ${Graficas.describir(g)} ${$("#perfil-g-fuente").textContent} ` : "") + hist;
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

  function iniciar() {
    if (!estado.mitos.length) return;
    if (estado.salon) salirSalon();
    prepararRecorrido();
    mostrar("juego");
    pintarPregunta();
  }

  function prepararRecorrido() {
    estado.indice = 0;
    estado.puntos = 0;
    estado.aciertos = [];
    estado.estimaciones = [];
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
      J.contador(estado.indice + 1, total, estado.puntos);
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
    prepararEstimacion(m);
    $("#opciones").hidden = estado.salon || estado.fase === "estimar";
    $("#salon-votar").hidden = !estado.salon || estado.fase === "estimar";
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
    aviso.append(acerto ? J.acierto : J.fallo(NOMBRES[respuesta]));
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

    $("#t-veredicto").textContent = J.respuesta(NOMBRES[m.veredicto]);
    const g = m.grafica;
    $("#g-titulo").textContent = g.titulo;
    $("#g-fuente").textContent = m.fuente;
    $("#g-nota").hidden = !g.nota;
    $("#g-nota").textContent = g.nota || "";
    $("#g-tabla").replaceChildren(Graficas.tabla(g));
    $("#explicacion").textContent = m.explicacion;
    $("#discusion").hidden = !estado.salon;
    $("#discusion-texto").textContent = m.discusion || "";
    pintarEnTuCaso(m);
    const ultima = estado.indice === estado.mitos.length - 1;
    $("#siguiente").textContent = estado.salon
      ? (ultima ? TEXTOS.salon.terminar : J.siguiente)
      : (ultima ? J.verResultado : J.siguiente);

    pintarProgreso();

    // Se lee dentro del clic: algunos navegadores solo permiten hablar como respuesta a una acción.
    Voz.anunciar(textoRevelacion());

    // Primero se ve el sello; luego baja a la explicación.
    estado.temporizador = setTimeout(() => {
      $("#revelacion").hidden = false;
      Graficas.dibujar($("#g-lienzo"), g);
      if (estado.caso && estado.caso.grafica) Graficas.dibujar($("#etc-lienzo"), estado.caso.grafica);
      $("#t-veredicto").focus({ preventScroll: true });
      (estado.salon ? $("#t-veredicto") : aviso)
        .scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "start" });
    }, sinMovimiento() ? 0 : 700);
  }

  // Bloque «Y en tu caso…»: el mismo dato para el estado o la edad de la persona.
  function pintarEnTuCaso(m) {
    const caso = estado.salon ? null : EnTuCaso.armar(m, {
      perfil: estado.perfil,
      ambito: estado.lugar,
      ambitoClave: estado.ambitoClave,
      anio: String(estado.aniosHistoria.at(-1)),
    });
    estado.caso = caso;
    $("#en-tu-caso").hidden = !caso;
    if (!caso) return;
    $("#etc-texto").textContent = caso.texto;
    $("#etc-figura").hidden = !caso.grafica;
    $("#etc-lienzo").replaceChildren();
    if (caso.grafica) {
      $("#etc-titulo").textContent = caso.grafica.titulo;
      $("#etc-fuente").textContent = caso.fuente;
      $("#etc-tabla").replaceChildren(Graficas.tabla(caso.grafica));
    }
  }

  // ---------- «Adivina antes de ver»

  const ESTIMAR = new Set(["primer-voto", "jovenes", "sesentas"]);

  // Qué se estima en cada pregunta y con qué datos: los de la persona o los del ámbito del juego.
  function objetivoEstimacion(m) {
    const E = TEXTOS.estimar;
    const { perfil } = estado;
    const datos = perfil.entidad != null ? perfil.local : estado.personalAmbito;
    if (!datos) return null;
    const anio = String(estado.aniosHistoria.at(-1));
    const lugar = datos.nombre;
    if (m.id === "primer-voto") return { quien: E.de18, real: datos.estimar[anio]["18"], lugar, anio };
    if (m.id === "sesentas") return { quien: E.de60a69, real: datos.estimar[anio]["60_69"], lugar, anio };
    if (m.id === "jovenes") {
      if (perfil.edad != null && perfil.edad >= 18 && !estado.salon) {
        const res = Personal.participacionEdad(datos, perfil.pais || estado.personalAmbito, anio, perfil.edad);
        if (res.nivel === "edad") return { quien: E.deTuEdad(perfil.edad), real: res.valor, lugar, anio };
      }
      return { quien: E.de18a29, real: datos.estimar[anio]["18_29"], lugar, anio };
    }
    return null;
  }

  function prepararEstimacion(m) {
    const E = TEXTOS.estimar;
    const obj = ESTIMAR.has(m.id) ? objetivoEstimacion(m) : null;
    estado.estimacion = obj;
    estado.fase = obj && obj.real != null ? "estimar" : "votar";
    $("#estimar").hidden = estado.fase !== "estimar";
    if (estado.fase !== "estimar") return;
    $("#est-pregunta").textContent = (estado.salon ? E.preguntaGrupo : E.pregunta)(obj.quien, obj.lugar, obj.anio);
    $("#est-control").hidden = estado.salon;
    $("#est-muestra").hidden = estado.salon;
    $("#est-ver").hidden = false;
    $("#est-resultado").hidden = true;
    $("#est-lienzo").replaceChildren();
    $("#est-unidad").textContent = E.unidad;
    ponerEstimacion(50);
  }

  function ponerEstimacion(v) {
    const valor = Math.max(0, Math.min(100, Math.round(v)));
    $("#est-rango").value = String(valor);
    $("#est-valor").textContent = String(valor);
    $("#est-rango").setAttribute("aria-valuetext", TEXTOS.estimar.valorTexto(valor));
  }

  function verDato() {
    if (estado.fase !== "estimar") return;
    const E = TEXTOS.estimar;
    const obj = estado.estimacion;
    const real = Math.round(obj.real);
    estado.fase = "votar";
    $("#est-control").hidden = true;
    $("#est-muestra").hidden = true;
    $("#est-ver").hidden = true;
    $("#est-resultado").hidden = false;
    let texto;
    if (estado.salon) {
      texto = E.resultadoGrupo(real);
      $("#salon-votar").hidden = false;
    } else {
      const pensaste = Number($("#est-rango").value);
      estado.estimaciones.push({ ...obj, pensaste, real });
      texto = E.resultado(pensaste, real) + E.diferencia(pensaste, real);
      const spec = {
        tipo: "barras", titulo: E.tituloGrafica(obj.quien, obj.lugar, obj.anio),
        items: [
          { etiqueta: E.tuEstimacion, valor: pensaste, color: "acento" },
          { etiqueta: E.datoReal, valor: obj.real, color: "datos" },
        ],
      };
      Graficas.dibujar($("#est-lienzo"), spec);
      $("#opciones").hidden = false;
    }
    $("#est-texto").textContent = `${texto} ${E.ahora}`;
    Voz.anunciar($("#est-texto").textContent);
  }

  function pintarEstimaciones() {
    const E = TEXTOS.estimar;
    const lista = estado.estimaciones;
    $("#estimaciones").hidden = !lista.length;
    if (!lista.length) return;
    const promedio = Math.round(lista.reduce((s, e) => s + Math.abs(e.real - e.pensaste), 0) / lista.length);
    $("#est-resumen").textContent = E.resumen(promedio);
    $("#est-lista").replaceChildren(...lista.map((e) => {
      const li = document.createElement("li");
      li.textContent = E.item(e.quien, e.lugar, e.pensaste, e.real);
      return li;
    }));
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

  // Avanza como en una presentación: dato estimado, luego el veredicto, luego la siguiente.
  function avanzarSalon() {
    if (estado.fase === "estimar") verDato();
    else if (!estado.revelada) revelar();
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

  function pintarResultado() {
    const total = estado.mitos.length;
    $("#t-resultado").textContent = TEXTOS.resultado.titulo(estado.puntos, total);
    $("#mensaje").textContent = TEXTOS.resultado.mensaje(estado.puntos, total, estado.lugar);
    $("#resumen").replaceChildren(...estado.mitos.map((m, i) => {
      const li = document.createElement("li");
      const ok = estado.aciertos[i];
      li.innerHTML = `<span class="marca-resumen ${ok ? "bien" : ""}">${icono(ok ? TRAZOS.bien : TRAZOS.mal)}</span>`;
      const txt = document.createElement("span");
      txt.textContent = TEXTOS.resultado.resumen(m.enunciado, NOMBRES[m.veredicto], ok);
      li.appendChild(txt);
      return li;
    }));
    $("#aviso-compartir").textContent = "";
    pintarPerfil();
    pintarHistoria();
    pintarEstimaciones();
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
    estado.ambitoClave = datos.ambito ? datos.ambito.clave : 0;
    if (datos.titulo) $("#t-portada").textContent = datos.titulo;
    $("#portada-entrada").textContent = P.entrada(total);
    const edicion = $("#edicion");
    if (datos.ambito && datos.ambito.clave) {
      edicion.textContent = P.edicion(estado.lugar);
      edicion.hidden = false;
      estado.entidadVersion = datos.ambito.clave; // el perfil empieza en ese estado
      llenarEstados("");
      cambiarEstadoPerfil();
    } else if (respaldo) {
      edicion.textContent = P.sinEdicion;
      edicion.hidden = false;
    }
    document.querySelectorAll(".enlace-imprimible").forEach((a) => { a.href = Datos.conEntidad("imprimible.html"); });
  }

  // ---------- final personalizado

  // ---------- pantalla de perfil

  const EDAD_MIN = Number($("#p-edad").min);
  const EDAD_MAX = Number($("#p-edad").max);
  const sinAcentos = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Lista de estados filtrada por lo que se escribe en el buscador.
  function llenarEstados(filtro) {
    const T = TEXTOS.perfilPantalla;
    const { entidades } = estado.datosPerfil;
    const elegido = $("#p-entidad").value || (estado.entidadVersion ? String(estado.entidadVersion) : "");
    const f = sinAcentos(filtro.trim());
    const visibles = entidades.entidades.filter((e) => sinAcentos(e.nombre).includes(f));
    const lista = $("#p-entidad");
    lista.replaceChildren(...[{ clave: "", nombre: T.sinEstado }, ...visibles].map((e) => {
      const o = document.createElement("option");
      o.value = String(e.clave);
      o.textContent = e.nombre;
      return o;
    }));
    if (visibles.length === 1 && f) lista.value = String(visibles[0].clave);
    else if ([...lista.options].some((o) => o.value === elegido)) lista.value = elegido;
    else lista.value = "";
    $("#buscar-ayuda").textContent = visibles.length ? T.estadosVisibles(visibles.length) : T.ninguno;
  }

  // Municipio: depende del estado y es opcional.
  async function cambiarEstadoPerfil() {
    const clave = $("#p-entidad").value;
    estado.municipiosEstado = null;
    $("#campo-municipio").hidden = true;
    if (!clave) return;
    const datos = await Personal.cargarMunicipios(clave);
    if (!datos || $("#p-entidad").value !== clave) return;
    estado.municipiosEstado = datos;
    $("#p-buscar-mun").value = "";
    llenarMunicipios("");
    $("#campo-municipio").hidden = false;
  }

  function llenarMunicipios(filtro) {
    const M = TEXTOS.municipio;
    const f = sinAcentos(filtro.trim());
    const visibles = estado.municipiosEstado.municipios.filter((m) => sinAcentos(m.nombre).includes(f));
    const lista = $("#p-municipio");
    const elegido = lista.value;
    lista.replaceChildren(...[{ clave: "", nombre: M.sinMunicipio }, ...visibles].map((m) => {
      const o = document.createElement("option");
      o.value = String(m.clave);
      o.textContent = m.nombre;
      return o;
    }));
    if (visibles.length === 1 && f) lista.value = String(visibles[0].clave);
    else if ([...lista.options].some((o) => o.value === elegido)) lista.value = elegido;
    else lista.value = "";
    $("#mun-ayuda").textContent = visibles.length ? M.visibles(visibles.length) : M.ninguno;
  }

  function cambiarEdad(paso) {
    const campo = $("#p-edad");
    const actual = campo.value === "" ? 18 - paso : Number(campo.value);
    campo.value = String(Math.min(EDAD_MAX, Math.max(EDAD_MIN, actual + paso)));
    $("#perfil-error").textContent = "";
  }

  async function confirmarPerfil() {
    const T = TEXTOS.perfilPantalla;
    const error = $("#perfil-error");
    const texto = $("#p-edad").value.trim();
    const edad = texto === "" ? null : Number(texto);
    const clave = $("#p-entidad").value === "" ? null : Number($("#p-entidad").value);
    if (edad !== null && (!Number.isInteger(edad) || edad < EDAD_MIN || edad > EDAD_MAX)) {
      error.textContent = T.errorEdad(EDAD_MIN, EDAD_MAX);
      $("#p-edad").focus();
      return;
    }
    if (edad === null && clave === null) {
      error.textContent = T.errorVacio;
      return;
    }
    try {
      const [pais, local] = await Promise.all([Personal.cargar(0), Personal.cargar(clave ?? 0)]);
      const claveMun = clave && estado.municipiosEstado ? $("#p-municipio").value : "";
      const municipio = claveMun ? estado.municipiosEstado.municipios.find((m) => String(m.clave) === claveMun) : null;
      estado.perfil = {
        edad, entidad: clave, nombre: clave ? local.nombre : null, local, pais,
        municipio: municipio ? { ...municipio, umbral: estado.municipiosEstado.umbral } : null,
      };
    } catch {
      error.textContent = T.errorDatos;
      return;
    }
    error.textContent = "";
    pintarMomento();
    mostrar("momento");
    Voz.anunciar(`${$("#t-momento").textContent} ${$("#momento-texto").textContent}`);
  }

  function prefieroNoDecir() {
    estado.perfil = { edad: null, entidad: null, nombre: null, local: null, pais: null, municipio: null };
    iniciar();
  }

  // Primer momento de la historia: desde cuándo puede votar y cuántas elecciones le tocaron.
  function pintarMomento() {
    const H = TEXTOS.historia;
    const { edad, nombre } = estado.perfil;
    const anios = estado.aniosHistoria;
    const prox = estado.proxima;
    const frases = [];
    if (edad !== null) {
      if (edad < 18) {
        const primera = Personal.primeraEleccion(edad, prox);
        frases.push(H.menor(primera, primera === prox.anio, prox.fecha));
      } else {
        const vividas = Personal.eleccionesVividas(edad, anios);
        if (!vividas.length) frases.push(H.sinElecciones(prox.fecha));
        else if (vividas.length === anios.length) frases.push(H.todas(anios.length, anios[0], anios.at(-1)));
        else frases.push(H.algunas(vividas[0], vividas.length, anios.length));
      }
      frases.push(H.lugar(nombre || TEXTOS.perfil.pais));
    } else {
      frases.push(H.soloLugar(nombre));
    }
    $("#t-momento").textContent = H.titulo(edad, nombre);
    $("#momento-texto").textContent = frases.join(" ");
  }

  // ---------- final personalizado

  // Arma el mensaje, la comparación y la gráfica con datos reales del año más reciente.
  function pintarPerfil() {
    const T = TEXTOS.perfil;
    const { edad: datosEdad, entidades } = estado.datosPerfil;
    const anio = String(Math.max(...datosEdad.anios));
    const { edad, entidad, nombre, local, pais } = estado.perfil;
    const r = T.deCada100;
    const promPais = entidades.nacional[anio];
    let mensaje;
    let comparacion;
    let items;
    let titulo = T.graficaTitulo(anio);
    let unidad = null;

    if (edad !== null) {
      const res = Personal.participacionEdad(local, pais, anio, edad);
      const lugar = res.nivel === "pais" ? T.pais : (nombre || T.pais);
      unidad = { valor: res.valor, quien: T.quien(res), lugar };
      mensaje = T.mensaje({ lugar, grupo: T.quien(res).replace(/^personas de /, ""), valor: r(res.valor), anio, menor: edad < 18 })
        + T.nota(res, nombre || T.pais);
      items = [{ etiqueta: T.etiquetaGrupoLugar(T.quien(res).replace(/^personas de /, ""), lugar), valor: res.valor, color: "datos" }];
      if (entidad) {
        items.push({ etiqueta: T.todo(nombre), valor: local.total[anio], color: "base" });
        comparacion = T.comparaEstado(nombre, r(local.total[anio]), r(promPais));
      } else {
        comparacion = T.comparaPais(r(promPais));
      }
      items.push({ etiqueta: T.todoPais, valor: promPais, color: "base" });
    } else if (entidad) {
      mensaje = T.mensaje({ lugar: nombre, grupo: null, valor: r(local.total[anio]), anio, menor: false });
      unidad = { valor: local.total[anio], quien: T.personas, lugar: nombre };
      comparacion = T.comparaPais(r(promPais));
      items = [
        { etiqueta: T.todo(nombre), valor: local.total[anio], color: "datos" },
        { etiqueta: T.todoPais, valor: promPais, color: "base" },
      ];
    } else {
      // Sin datos de la persona: el dato del país y cómo votó cada grupo de edad.
      mensaje = T.mensaje({ lugar: T.pais, grupo: null, valor: r(promPais), anio, menor: false });
      comparacion = T.contexto;
      titulo = T.graficaGrupos(anio);
      items = datosEdad.grupos.map((g, i) => ({
        etiqueta: T.grupoLegible(g), valor: datosEdad.datos[anio]["0"][i], color: "datos",
      }));
    }

    // Línea del municipio, si la persona lo eligió.
    const mun = estado.perfil.municipio;
    $("#perfil-municipio").hidden = !mun;
    if (mun) {
      const v = mun.participacion[anio];
      $("#perfil-municipio").textContent = v == null
        ? TEXTOS.municipio.sinDato(mun.nombre, mun.umbral)
        : TEXTOS.municipio.final(mun.nombre, Math.round(v), anio);
    }

    estado.textoPerfil = mensaje;
    $("#perfil-mensaje").textContent = mensaje;
    $("#perfil-comparacion").textContent = comparacion;
    // Con perfil, el dato se ve como 100 personas como tú; sin perfil, la gráfica por grupos de edad.
    const spec = unidad
      ? { tipo: "unidades", titulo: T.tituloUnidades(unidad.quien, unidad.lugar, anio), valor: unidad.valor, etiqueta: unidad.quien }
      : { tipo: "barras", titulo, items };
    estado.unidadPerfil = unidad;
    titulo = spec.titulo;
    $("#perfil-g-titulo").textContent = titulo;
    $("#perfil-g-fuente").textContent = T.fuente(anio);
    $("#perfil-g-tabla").replaceChildren(Graficas.tabla(spec));
    $("#perfil-g-lienzo").dataset.spec = JSON.stringify(spec);
  }

  // ---------- tu historia como votante

  // Línea de tiempo 2009–2024 con la participación de su edad (o grupo, según el umbral) y la próxima elección.
  function pintarHistoria() {
    const H = TEXTOS.historiaVotante;
    const P = TEXTOS.perfil;
    const { edad, entidad, nombre, local, pais } = estado.perfil;
    const seccion = $("#historia");
    seccion.hidden = edad == null && entidad == null;
    if (seccion.hidden) return;
    const anios = estado.aniosHistoria;
    const prox = estado.proxima;
    const lugar = nombre || P.pais;
    const filas = [];
    let intro;
    let ultima;
    let anioFinal = prox.anio;

    if (edad == null) {
      intro = H.introSinEdad(lugar);
      anios.forEach((a) => filas.push({ anio: a, edadEntonces: null, texto: H.valorTotal(Math.round(local.total[a]), lugar), valor: local.total[a] }));
      ultima = H.proxima(prox.fecha);
    } else {
      const vividas = Personal.eleccionesVividas(edad, anios);
      if (!vividas.length) {
        intro = H.introMenor(lugar);
        anios.forEach((a) => {
          const res = Personal.participacionEdad(local, pais, a, 18);
          filas.push({ anio: a, edadEntonces: 18, texto: H.valor(Math.round(res.valor), P.quien(res), res.nivel === "pais" ? P.pais : lugar), valor: res.valor });
        });
        const primera = Personal.primeraEleccion(edad, prox);
        anioFinal = primera;
        ultima = H.primera(primera, primera === prox.anio, prox.fecha);
      } else {
        intro = H.intro(lugar);
        vividas.forEach((a) => {
          const e = Personal.edadEn(edad, a);
          const res = Personal.participacionEdad(local, pais, a, e);
          const donde = res.nivel === "pais" ? P.pais : lugar;
          filas.push({
            anio: a, edadEntonces: e,
            texto: `${H.tenias(e)} ${H.valor(Math.round(res.valor), P.quien(res), donde)}${P.nota(res, lugar)}`,
            valor: res.valor,
          });
        });
        ultima = H.proxima(prox.fecha);
      }
    }

    $("#historia-intro").textContent = intro;
    const items = filas.map((f) => {
      const li = document.createElement("li");
      li.className = "hito";
      const tipo = H.tipo(estado.presidenciales.includes(f.anio));
      li.innerHTML = `<span class="hito-anio"></span><span class="hito-cuerpo"><span class="hito-tipo"></span>
        <span class="hito-texto"></span><span class="hito-barra" aria-hidden="true"><span></span></span></span>`;
      li.querySelector(".hito-anio").textContent = String(f.anio);
      li.querySelector(".hito-tipo").textContent = `${tipo}.`;
      li.querySelector(".hito-texto").textContent = f.texto;
      li.querySelector(".hito-barra span").style.width = `${f.valor}%`;
      return li;
    });
    const fin = document.createElement("li");
    fin.className = "hito hito-proxima";
    fin.innerHTML = `<span class="hito-anio"></span><span class="hito-cuerpo"><span class="hito-texto"></span>
      <span class="hito-casilla" aria-hidden="true"></span><span class="hito-tipo"></span></span>`;
    fin.querySelector(".hito-anio").textContent = String(anioFinal);
    fin.querySelector(".hito-texto").textContent = ultima;
    fin.querySelector(".hito-tipo").textContent = H.porMarcar;
    $("#historia-lista").replaceChildren(...items, fin);

    // Tabla para lectores de pantalla y para quien prefiera los números.
    const t = document.createElement("table");
    const cab = t.createTHead().insertRow();
    H.columnas.forEach((c, i) => {
      const th = document.createElement("th");
      th.textContent = c;
      if (i === 3) th.className = "num";
      cab.appendChild(th);
    });
    const cuerpo = t.createTBody();
    filas.forEach((f) => {
      const r = cuerpo.insertRow();
      r.insertCell().textContent = String(f.anio);
      r.insertCell().textContent = H.tipo(estado.presidenciales.includes(f.anio));
      r.insertCell().textContent = f.edadEntonces == null ? "—" : String(f.edadEntonces);
      const c = r.insertCell();
      c.textContent = f.valor.toFixed(1);
      c.className = "num";
    });
    $("#historia-tabla").replaceChildren(t);
    $("#historia-fuente").textContent = H.fuente(anios[0], anios.at(-1));
  }

  // Dirección del juego, sin parámetros.
  function urlJuego() {
    return location.origin + location.pathname.replace(/index\.html$/, "");
  }

  // Enlace de reto: solo lleva el puntaje (nunca edad, estado ni compromiso).
  function urlReto() {
    return `${urlJuego()}?reto=${estado.puntos}-${estado.mitos.length}`;
  }

  // Si se llega con un reto válido, la portada lo dice.
  function leerReto(total) {
    const valor = new URLSearchParams(location.search).get("reto") || "";
    const m = valor.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!m) return;
    const [puntos, de] = [Number(m[1]), Number(m[2])];
    if (de < 1 || de > Math.max(total, 20) || puntos > de) return;
    $("#reto-aviso").textContent = TEXTOS.reto.aviso(puntos, de);
    $("#reto-aviso").hidden = false;
  }

  // ---------- compromiso y reto entre generaciones

  function textoCompromiso(clave) {
    const o = TEXTOS.compromiso.opciones[clave];
    return typeof o === "function" ? o(estado.proxima.anio) : o;
  }

  function elegirCompromiso(clave) {
    estado.compromiso = clave;
    document.querySelectorAll(".compromiso-btn").forEach((b) => {
      const activo = b.dataset.compromiso === clave;
      b.setAttribute("aria-pressed", String(activo));
      b.querySelector(".casilla").classList.toggle("marcada", activo);
    });
    $("#compromiso-aviso").textContent = TEXTOS.compromiso.elegido(textoCompromiso(clave));
    dibujarTarjeta();
  }

  async function retarGeneracion() {
    const R = TEXTOS.reto;
    const datos = estado.personalAmbito;
    const anio = String(estado.aniosHistoria.at(-1));
    const texto = R.generacion(estado.puntos, estado.mitos.length,
      Math.round(datos.estimar[anio]["18_29"]), Math.round(datos.estimar[anio]["60_69"]), anio, datos.nombre);
    const url = urlReto();
    try {
      if (navigator.share) {
        await navigator.share({ title: TEXTOS.compartir.titulo, text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(`${texto} ${url}`);
      $("#reto-aviso-cierre").textContent = R.copiado;
    } catch (err) {
      if (err.name === "AbortError") return;
      $("#reto-aviso-cierre").textContent = TEXTOS.compartir.copiaManual(`${texto} ${url}`);
    }
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

  // 10 x 10 casillas de boleta en el canvas, con X azul en las que votaron.
  function dibujarUnidades(ctx, x0, y0, lado, si, C) {
    const sep = 4;
    const celda = (lado - 9 * sep) / 10;
    for (let i = 0; i < 100; i += 1) {
      const x = x0 + (i % 10) * (celda + sep);
      const y = y0 + Math.floor(i / 10) * (celda + sep);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, celda, celda);
      ctx.lineWidth = 2;
      ctx.strokeStyle = i < si ? C.tinta : C.gris;
      ctx.strokeRect(x, y, celda, celda);
      if (i < si) {
        const m = celda * 0.22;
        ctx.strokeStyle = C.azul;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x + m, y + m); ctx.lineTo(x + celda - m, y + celda - m);
        ctx.moveTo(x + celda - m, y + m); ctx.lineTo(x + m, y + celda - m);
        ctx.stroke();
      }
    }
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
    ctx.fillText(T.miResultado, izq, y0 + 225);

    ctx.fillStyle = C.tinta;
    ctx.font = `700 180px ${F}`;
    ctx.fillText(T.marcador(estado.puntos, total), izq - 8, y0 + 395);

    // Casillas marcadas, una por pregunta
    const lado = 64, sep = 18;
    estado.aciertos.forEach((ok, i) => {
      const x = izq + i * (lado + sep);
      const y = y0 + 430;
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
    ctx.fillText(T.perfil, izq, y0 + 570);
    // Pictograma de 100 personas como tú, a la derecha del dato.
    const unidad = estado.unidadPerfil;
    const ladoGrid = 210;
    if (unidad) dibujarUnidades(ctx, x0 + w - 60 - ladoGrid, y0 + 540, ladoGrid, Math.round(unidad.valor), C);
    ctx.fillStyle = C.tinta;
    ctx.font = `700 38px ${F}`;
    envolver(ctx, estado.textoPerfil, unidad ? anchoTexto - ladoGrid - 40 : anchoTexto).slice(0, 4).forEach((l, i) => {
      ctx.fillText(l, izq, y0 + 625 + i * 48);
    });

    // Compromiso elegido en el cierre
    if (estado.compromiso) {
      ctx.fillStyle = C.suave;
      ctx.font = `400 30px ${F}`;
      ctx.fillText(TEXTOS.compromiso.tarjeta, izq, y0 + 805);
      const cx = izq, cy = y0 + 818, cl = 40;
      ctx.lineWidth = 5;
      ctx.strokeStyle = C.tinta;
      ctx.strokeRect(cx, cy, cl, cl);
      ctx.strokeStyle = C.azul;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy + 10); ctx.lineTo(cx + cl - 10, cy + cl - 10);
      ctx.moveTo(cx + cl - 10, cy + 10); ctx.lineTo(cx + 10, cy + cl - 10);
      ctx.stroke();
      ctx.fillStyle = C.tinta;
      ctx.font = `700 34px ${F}`;
      envolver(ctx, textoCompromiso(estado.compromiso), anchoTexto - 300).slice(0, 2)
        .forEach((l, i) => ctx.fillText(l, cx + cl + 18, cy + 31 + i * 40));
    }

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
    ctx.font = `700 56px ${F}`;
    ctx.fillText(T.meGanas, izq, yQr + 76);
    ctx.font = `400 30px ${F}`;
    ctx.fillText(T.juegaEn, izq, yQr + 114);
    // La dirección se parte después del dominio para que quepa junto al QR.
    const url = urlJuego().replace(/^https?:\/\//, "");
    const corte = url.indexOf("/") + 1;
    ctx.fillStyle = C.azul;
    ctx.font = `700 30px ${F}`;
    [url.slice(0, corte), url.slice(corte)].filter(Boolean)
      .forEach((l, i) => ctx.fillText(l, izq, yQr + 152 + i * 36));
    ctx.fillStyle = C.suave;
    ctx.font = `400 24px ${F}`;
    if (qr) ctx.fillText(T.qr, izq, yQr + 230);
    ctx.textAlign = "center";
    envolver(ctx, T.fuente(anios[0], anios.at(-1)), w - 80)
      .forEach((l, i) => ctx.fillText(l, x0 + w / 2, y0 + h + 50 + i * 30));

    c.setAttribute("aria-label", T.descripcion(estado.puntos, total, estado.textoPerfil)
      + (estado.compromiso ? ` ${TEXTOS.compromiso.tarjeta} ${textoCompromiso(estado.compromiso)}.` : ""));
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
    const datos = { title: C.titulo, text: C.reto(estado.puntos, estado.mitos.length, estado.lugar), url: urlReto() };
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
    const texto = C.retoConEnlace(estado.puntos, estado.mitos.length, estado.lugar, urlReto());
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
    estado.personalAmbito = await Personal.cargar(datos.ambito ? datos.ambito.clave : 0).catch(() => null);
    // Una versión estatal generada con un script anterior puede no traer estos datos: se usan los nacionales.
    const config = datos.proxima_eleccion && datos.presidenciales ? datos
      : await fetch("data/mitos.json").then((r) => r.json());
    estado.proxima = config.proxima_eleccion;
    estado.presidenciales = config.presidenciales;
    document.querySelectorAll(".compromiso-btn").forEach((b) => {
      b.querySelector(".compromiso-texto").textContent = textoCompromiso(b.dataset.compromiso);
    });
    estado.aniosHistoria = edad.anios;
    llenarEstados("");
    pintarPortada(datos, respaldo);
    leerReto(datos.niveles.reduce((n, nivel) => n + nivel.mitos.length, 0));
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
  $("#perfil-continuar").addEventListener("click", confirmarPerfil);
  $("#est-rango").addEventListener("input", (e) => ponerEstimacion(Number(e.target.value)));
  $("#est-menos").addEventListener("click", () => ponerEstimacion(Number($("#est-rango").value) - 1));
  $("#est-mas").addEventListener("click", () => ponerEstimacion(Number($("#est-rango").value) + 1));
  $("#est-ver").addEventListener("click", verDato);
  document.querySelectorAll(".compromiso-btn").forEach((b) => {
    b.querySelector(".compromiso-texto").textContent = "";
    b.addEventListener("click", () => elegirCompromiso(b.dataset.compromiso));
  });
  $("#descargar-cierre").addEventListener("click", descargar);
  $("#reto-generacion").addEventListener("click", retarGeneracion);
  $("#perfil-no-decir").addEventListener("click", prefieroNoDecir);
  $("#edad-menos").addEventListener("click", () => cambiarEdad(-1));
  $("#edad-mas").addEventListener("click", () => cambiarEdad(1));
  $("#p-edad").addEventListener("input", () => { $("#perfil-error").textContent = ""; });
  $("#p-buscar").addEventListener("input", (e) => { llenarEstados(e.target.value); cambiarEstadoPerfil(); });
  $("#p-entidad").addEventListener("change", cambiarEstadoPerfil);
  $("#p-buscar-mun").addEventListener("input", (e) => llenarMunicipios(e.target.value));
  $("#p-buscar-mun").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); $("#p-municipio").focus(); }
  });
  // Enter en el buscador pasa a la lista para elegir con las flechas.
  $("#p-buscar").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); $("#p-entidad").focus(); }
  });
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
    $("#portada-entrada").textContent = J.errorCarga;
  });
})();
