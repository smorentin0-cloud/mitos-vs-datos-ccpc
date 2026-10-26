/*
 * Textos de la interfaz que arma JavaScript. Están juntos para facilitar una traducción futura.
 * Las cifras nunca se escriben aquí: llegan de los JSON que genera scripts/procesar.py.
 *
 * Para traducir el sitio hay que revisar tres lugares:
 *   1. site/index.html e imprimible.html  (texto fijo de las pantallas)
 *   2. este archivo                      (texto que arma JavaScript)
 *   3. scripts/procesar.py               (frases, explicaciones y preguntas para conversar)
 */
const TEXTOS = {
  veredictos: { cierto: "Cierto", falso: "Falso" },
  juego: {
    pregunta: (n, total) => `Pregunta ${n} de ${total}.`,
    contador: (n, total, puntos) => `Pregunta ${n} de ${total}. Aciertos: ${puntos}.`,
    cierto_o_falso: "¿Es cierto o falso? Elige Cierto o Falso.",
    acierto: "¡Acertaste! Sumas 1 punto.",
    fallo: (marcada) => `No esta vez. Marcaste «${marcada}».`,
    respuesta: (veredicto) => `La respuesta es: ${veredicto}`,
    graficaMuestra: "La gráfica muestra lo siguiente.",
    siguiente: "Siguiente pregunta",
    verResultado: "Ver mi resultado",
    errorCarga: "No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.",
  },
  resultado: {
    titulo: (puntos, total) => `Acertaste ${puntos} de ${total}`,
    mensaje: (puntos, total, lugar) => {
      if (puntos === total) return "¡Todas bien! Los mitos no pueden contigo. Ahora reta a alguien más.";
      if (puntos >= total - 2) return `¡Muy bien! Conoces cómo vota ${lugar}.`;
      if (puntos >= total / 2) return "Vas bien. Algunos mitos todavía te engañaron.";
      return "Los mitos te ganaron esta vez, pero ahora ya conoces los datos.";
    },
    resumen: (enunciado, veredicto, acerto) =>
      `${enunciado} Respuesta: ${veredicto}. ${acerto ? "Acertaste." : "Fallaste."}`,
  },
  explora: {
    todoPais: "Todo el país",
    tituloEdad: (lugar, anio) => `Participación por grupo de edad: ${lugar}, ${anio}`,
    ejeEdad: "Grupo de edad (años)",
    promedioNacional: "Promedio nacional",
    tituloEstados: (anio) => `Participación por estado, ${anio}`,
    fuente: (anio) => `Fuente: INE, Conteos Censales de Participación Ciudadana, ${anio}.`,
    error: "No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.",
  },
  voz: { detener: "Detener" },
  graficas: {
    sinDato: "sin dato",
    grupo: "Grupo",
    participacion: "Participación",
    anio: "Año",
    tipo: "Tipo",
    resumenSerie: (desde, x0, hasta, x1, min, xMin, max, xMax) =>
      `de ${desde} en ${x0} a ${hasta} en ${x1}; mínimo de ${min} en ${xMin} y máximo de ${max} en ${xMax}`,
  },
  portada: {
    entrada: (n) => `Todo mundo repite frases sobre quién vota y quién no. Aquí hay ${n}. Marca si crees que son ciertas o falsas, y los datos del INE te dicen la respuesta.`,
    edicion: (lugar) => `Esta versión usa solo datos de ${lugar}. Las frases que no se cumplen con los datos de este estado no aparecen.`,
    sinEdicion: 'Todavía no hay una versión para ese estado; estás jugando la versión de todo el país.',
  },
  compartir: {
    titulo: "Mitos vs. Datos",
    // Lo que se comparte o se copia siempre lleva el reto.
    reto: (puntos, total, lugar) => `Acerté ${puntos} de ${total} en «Mitos vs. Datos», el juego sobre cómo vota ${lugar}. ¿Me ganas? Juega en:`,
    retoConEnlace: (puntos, total, lugar, url) => `${TEXTOS.compartir.reto(puntos, total, lugar)} ${url}`,
    copiado: "Copiamos el reto con el enlace. Pégalo donde quieras.",
    copiaManual: (texto) => `Copia este texto: ${texto}`,
    descargada: "Tarjeta descargada.",
  },
  tarjeta: {
    marca: "Mitos vs. Datos",
    sello: "¿MITO O DATO?",
    miResultado: "Mi resultado",
    marcador: (puntos, total) => `${puntos} de ${total}`,
    perfil: "Cómo vota alguien como yo:",
    meGanas: "¿Me ganas?",
    juegaEn: "Juega en:",
    qr: "o escanea el código",
    fuente: (desde, hasta) => `Datos: INE, Conteos Censales de Participación Ciudadana ${desde}–${hasta}`,
    descripcion: (puntos, total, perfil) =>
      `Tarjeta de resultado: ${puntos} de ${total} respuestas correctas. ${perfil} ¿Me ganas? Incluye un código QR que lleva al juego.`,
  },
  imprimible: {
    folio: (n, total, nivel, nombreNivel) => `Tarjeta ${n} de ${total}. Nivel ${nivel}: ${nombreNivel}`,
    frente: (n, total) => `Tarjeta ${n} de ${total}, frente`,
    reverso: (n, total) => `Tarjeta ${n} de ${total}, reverso`,
    pregunta: '¿Mito o dato?',
    instruccionFrente: 'Marca tu respuesta antes de voltear la hoja.',
    respuesta: (veredicto) => `La respuesta es: ${veredicto}`,
    paraConversar: 'Para conversar:',
    listas: (n) => `Listas ${n} tarjetas. Usa el botón Imprimir o el menú de tu navegador.`,
    error: 'No se pudieron cargar las tarjetas. Recarga la página para intentarlo de nuevo.',
  },
  salon: {
    votar: "Levanten la mano: ¿cierto o falso?",
    contador: (n, total) => `Pregunta ${n} de ${total}.`,
    paraConversar: "Para conversar:",
    terminar: "Terminar",
  },
  perfilPantalla: {
    sinEstado: "Sin estado",
    estadosVisibles: (n) => (n === 1 ? "1 estado coincide. Elígelo en la lista." : `${n} estados en la lista. Escribe para buscar.`),
    ninguno: "Ningún estado coincide. Revisa cómo lo escribiste.",
    errorEdad: (min, max) => `Escribe una edad de ${min} a ${max} años, o déjala vacía.`,
    errorVacio: "Escribe tu edad o elige tu estado. Si prefieres no decir, usa el botón «Prefiero no decir».",
    errorDatos: "No pudimos cargar los datos de tu estado. Revisa tu conexión o elige «Prefiero no decir».",
  },
  historia: {
    // Primer momento de la historia, antes de la primera pregunta.
    titulo: (edad, lugar) => (edad != null ? `Tienes ${edad} años${lugar ? ` y vives en ${lugar}` : ""}.` : `Vives en ${lugar}.`),
    menor: (anio, esProxima, fecha) => `Todavía no puedes votar. Tu primera elección federal será ${esProxima ? `en ${fecha}` : `la de ${anio}`}.`,
    sinElecciones: (fecha) => `Todavía no te ha tocado una elección federal: tu primera será en ${fecha}.`,
    todas: (n, desde, hasta) => `De las ${n} elecciones federales de esta historia (${desde} a ${hasta}), te tocaron las ${n}.`,
    algunas: (primera, n, total) =>
      `Pudiste votar por primera vez en la elección de ${primera}. Te ${n === 1 ? "ha tocado 1" : `han tocado ${n}`} de las ${total} elecciones de esta historia.`,
    lugar: (lugar) => `En cada pregunta vas a ver cómo vota la gente como tú en ${lugar}.`,
    soloLugar: (lugar) => `En cada pregunta vas a ver cómo vota la gente de ${lugar}.`,
  },
  perfil: {
    titulo: "¿Cómo vota alguien como tú?",
    // grupo: "25 a 29 años", "85 años o más"
    grupoLegible: (g) => (g.includes("más") ? `${g.replace(" y más", "")} años o más` : `${g.replace("–", " a ")} años`),
    edadLegible: (e) => (e >= 85 ? "85 años o más" : `${e} años`),
    // A quién se refiere la cifra según el nivel que alcanzó el umbral de lista nominal.
    quien: (r) => (r.nivel === "grupo"
      ? `personas de ${TEXTOS.perfil.grupoLegible(r.grupo)}`
      : `personas de ${TEXTOS.perfil.edadLegible(r.edad)}`),
    nota: (r, lugarPedido) => {
      if (r.nivel === "grupo") return ` En ${r.lugar} hay pocas personas de ${TEXTOS.perfil.edadLegible(r.edad)} en la lista nominal; por eso usamos su grupo de edad.`;
      if (r.nivel === "pais") return ` En ${lugarPedido} hay pocas personas de esa edad en la lista nominal; por eso usamos el dato del país.`;
      return "";
    },
    pais: "México",
    todoPais: "Todo el país",
    todo: (estado) => `Todo ${estado}`,
    deCada100: (v) => Math.round(v),
    mensaje: ({ lugar, grupo, valor, anio, menor }) => {
      const base = grupo
        ? `En ${lugar}, de cada 100 personas de ${grupo}, votaron ${valor} en ${anio}.`
        : `En ${lugar} votaron ${valor} de cada 100 personas en ${anio}.`;
      return menor ? `Cuando cumplas 18: ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
    },
    comparaEstado: (estado, vEstado, vPais) =>
      `El promedio de ${estado} fue de ${vEstado} de cada 100, y el del país, de ${vPais} de cada 100.`,
    comparaPais: (vPais) => `El promedio del país fue de ${vPais} de cada 100.`,
    contexto: "Así votó cada grupo de edad en el país.",
    graficaTitulo: (anio) => `Participación en ${anio}`,
    graficaGrupos: (anio) => `Participación por grupo de edad en todo el país, ${anio}`,
    etiquetaGrupoLugar: (grupo, lugar) => `${grupo} en ${lugar}`,
    fuente: (anio) => `Fuente: INE, Conteos Censales de Participación Ciudadana, ${anio}.`,
  },
};
