/*
 * Textos de la interfaz que arma JavaScript. Están juntos para facilitar una traducción futura.
 * Las cifras nunca se escriben aquí: llegan de los JSON que genera scripts/procesar.py.
 */
const TEXTOS = {
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
  perfil: {
    titulo: "¿Cómo vota alguien como tú?",
    noDecir: "Prefiero no decir",
    menor: "Tengo menos de 18",
    // grupo: "25 a 29 años", "85 años o más"
    grupoLegible: (g) => (g.includes("más") ? `${g.replace(" y más", "")} años o más` : `${g.replace("–", " a ")} años`),
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
