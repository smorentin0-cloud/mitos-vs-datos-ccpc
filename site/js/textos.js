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
  lectura: {
    boton: "Opciones de lectura",
    botonConVoz: "Opciones de lectura (voz activada)",
  },
  graficas: {
    sinDato: "sin dato",
    grupo: "Grupo",
    participacion: "Participación",
    anio: "Año",
    tipo: "Tipo",
    deCada100: "De cada 100",
    votaron: "Votaron",
    noVotaron: "No votaron",
    unidades: (titulo, quien, si, no) => `${titulo}. De cada 100 ${quien}, votaron ${si} y no votaron ${no}.`,
    leyendaSi: (n) => `Votaron: ${n}`,
    leyendaNo: (n) => `No votaron: ${n}`,
    resumenSerie: (desde, x0, hasta, x1, min, xMin, max, xMax) =>
      `de ${desde} en ${x0} a ${hasta} en ${x1}; mínimo de ${min} en ${xMin} y máximo de ${max} en ${xMax}`,
  },
  portada: {
    entrada: (n) => `Todo mundo repite frases sobre quién vota. Aquí hay ${n}: marca si son ciertas o falsas y los datos del INE te dirán la respuesta.`,
    edicion: (lugar) => `Edición ${lugar}: solo frases que se cumplen con los datos de este estado.`,
    sinEdicion: 'Todavía no hay una versión para ese estado; estás jugando la versión de todo el país.',
  },
  compromiso: {
    opciones: {
      credencial: "Revisar que mi credencial esté vigente",
      votar: (anio) => `Votar en ${anio}`,
      invitar: "Invitar a alguien de otra generación a jugar",
    },
    elegido: (texto) => `Tu compromiso: ${texto}. Ya está en tu tarjeta.`,
    tarjeta: "Mi compromiso:",
  },
  reto: {
    // El enlace de reto solo lleva el puntaje; nunca edad, estado ni compromiso.
    aviso: (puntos, total) => `Alguien te retó: sacó ${puntos} de ${total}. ¿Le ganas?`,
    avisoEstado: (puntos, total, lugar) => `Alguien te retó en la edición de ${lugar}: sacó ${puntos} de ${total}. ¿Le ganas?`,
    generacion: (puntos, total, j, s, anio, lugar) =>
      `Saqué ${puntos} de ${total} en «Mitos vs. Datos». ¿Sabías que en ${anio}, en ${lugar}, votaron ${j} de cada 100 personas de 18 a 29 años y ${s} de cada 100 de 60 a 69? Juega y compara tu generación con la mía:`,
    copiado: "Copiamos el reto con el enlace. Mándaselo a alguien de otra generación.",
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
    estimacionPregunta: (quien, lugar, anio) => `Antes de responder: ¿cuántas de cada 100 ${quien} en ${lugar} crees que votaron en ${anio}?`,
    estimacionEspacio: "Mi estimación: ______ de cada 100",
    datoReal: (v, quien, lugar, anio) => `Dato real: ${v} de cada 100 ${quien} en ${lugar} votaron en ${anio}.`,
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
  municipio: {
    sinMunicipio: "Sin municipio",
    visibles: (n) => (n === 1 ? "1 municipio coincide." : `${n} municipios en la lista. Escribe para buscar.`),
    ninguno: "Ningún municipio coincide.",
    final: (nombre, v, anio) => `En tu municipio, ${nombre}, votaron ${v} de cada 100 personas en ${anio}.`,
    sinDato: (nombre, umbral) => `En ${nombre} hay menos de ${umbral.toLocaleString("es-MX")} personas en la lista nominal; es muy poco para dar un dato confiable.`,
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
  estimar: {
    // «Adivina antes de ver»: se pide antes de Cierto/Falso en algunas preguntas.
    pregunta: (quien, lugar, anio) => `Antes de responder, adivina: ¿cuántas de cada 100 ${quien} en ${lugar} crees que votaron en ${anio}?`,
    preguntaGrupo: (quien, lugar, anio) => `Pregunta al grupo: ¿cuántas de cada 100 ${quien} en ${lugar} creen que votaron en ${anio}?`,
    de18: "personas de 18 años",
    deTuEdad: (edad) => `personas de ${edad} años (la edad que tenías)`,
    de18a29: "personas de 18 a 29 años",
    de60a69: "personas de 60 a 69 años",
    unidad: "de cada 100",
    valorTexto: (v) => `${v} de cada 100`,
    resultado: (pensaste, real) => `Pensaste ${pensaste}; en realidad fueron ${real}.`,
    diferencia: (pensaste, real) => {
      const d = real - pensaste;
      if (Math.abs(d) <= 3) return " ¡Le atinaste o casi!";
      return d > 0 ? ` Votaron ${d} más de lo que pensaste.` : ` Votaron ${-d} menos de lo que pensaste.`;
    },
    resultadoGrupo: (real) => `En realidad fueron ${real} de cada 100.`,
    ahora: "Ahora, ¿la frase es cierta o falsa?",
    tuEstimacion: "Tu estimación",
    datoReal: "Dato real",
    tituloGrafica: (quien, lugar, anio) => `Tu estimación y el dato real: ${quien} en ${lugar}, ${anio}`,
    resumen: (promedio) => (promedio <= 5
      ? `Tus estimaciones quedaron, en promedio, a ${promedio} puntos del dato real. ¡Conoces bien cómo se vota!`
      : `Tus estimaciones quedaron, en promedio, a ${promedio} puntos del dato real.`),
    item: (quien, lugar, pensaste, real) => `${quien[0].toUpperCase()}${quien.slice(1)} en ${lugar}: pensaste ${pensaste}, fueron ${real}.`,
  },
  enTuCaso: {
    titulo: "Y en tu caso…",
    // Cada texto empieza diciendo si el estado se parece al país. Después, el dato en positivo.
    igual: (lugar) => `En ${lugar} pasa lo mismo:`,
    distinto: (lugar) => `En ${lugar} es distinto:`,
    empate: (lugar) => `En ${lugar} casi empatan:`,
    // Datos de cada mito (las cifras llegan de personal.json)
    sexo: (m, h, anio, pct) => `en ${anio} votó el ${pct(m)} de las mujeres y el ${pct(h)} de los hombres.`,
    mujeres: "Mujeres",
    hombres: "Hombres",
    tituloSexo: (lugar, anio) => `Participación por sexo en ${lugar}, ${anio}`,
    campoSinDatos: (lugar) => `En ${lugar} hay muy pocas secciones rurales en la lista nominal para comparar el campo con la ciudad.`,
    campo: (d, pct) => ({
      coincide: `en alguna elección el campo votó igual o más que la ciudad. En ${d.anio}: ${pct(d.rural)} en secciones rurales y ${pct(d.urbana)} en urbanas.`,
      empate: `en ${d.anio} el campo y la ciudad votaron casi igual: ${pct(d.rural)} y ${pct(d.urbana)}.`,
      contrario: `el campo votó menos que la ciudad en las 6 elecciones. En ${d.anio}: ${pct(d.rural)} en secciones rurales y ${pct(d.urbana)} en urbanas.`,
    }[d.relacion]),
    rural: "Rural",
    urbana: "Urbana",
    tituloCampo: (lugar, anio) => `Participación por tipo de sección en ${lugar}, ${anio}`,
    intermedias: (d, pct) => {
      const i = `${d.intermedia[0]}, ${pct(d.intermedia[1])}`;
      const p = `${d.presidencial[0]}, ${pct(d.presidencial[1])}`;
      return {
        coincide: `su intermedia con más participación (${i}) quedó debajo de su presidencial con menos (${p}).`,
        empate: `su intermedia más alta (${i}) quedó muy cerca de su presidencial más baja (${p}).`,
        contrario: `la intermedia de ${d.intermedia[0]} (${pct(d.intermedia[1])}) superó a la presidencial de ${d.presidencial[0]} (${pct(d.presidencial[1])}).`,
      }[d.relacion];
    },
    presidencial: "Presidencial",
    intermedia: "Intermedia",
    tituloElecciones: (lugar) => `Participación en ${lugar} por elección`,
    tendencia: (d, pct) => {
      const serie = d.intermedias.map(([a, v]) => `${pct(v)} en ${a}`).join(", ").replace(/, ([^,]*)$/, " y $1");
      return {
        coincide: `la participación subió en cada intermedia: ${serie}.`,
        empate: `entre algunas intermedias casi no cambió: ${serie}.`,
        contrario: `la participación bajó en alguna intermedia: ${serie}.`,
      }[d.relacion];
    },
    tituloIntermedias: (lugar) => `Participación en las intermedias en ${lugar}`,
    primerVoto: (d, v18, prom, lugar, pct) => ({
      coincide: `a los 18 años votó el ${pct(v18)}, más que el promedio de ${lugar} (${pct(prom)}).`,
      empate: `a los 18 años votó el ${pct(v18)}; el promedio de ${lugar} fue de ${pct(prom)}.`,
      contrario: `a los 18 años votó el ${pct(v18)}, menos que el promedio de ${lugar} (${pct(prom)}).`,
    }[d.relacion]),
    // Siempre con la edad que la persona tenía en la elección de referencia.
    tuEdad: (edad, lugar, valor, quien, anio) => `En ${anio} tenías ${edad} años. En ${lugar}, de cada 100 ${quien}, votaron ${valor}.`,
    cuandoCumplas: (lugar, valor, anio) => `Cuando cumplas 18: en ${lugar}, de cada 100 personas de 18 años, votaron ${valor} en ${anio}.`,
    a18: (lugar) => `18 años en ${lugar}`,
    aTuEdad: (quien, lugar) => `${quien.replace(/^personas de /, "")} en ${lugar}`,
    promedio: (lugar) => `Promedio de ${lugar}`,
    tituloEdad: (lugar, anio) => `Participación por edad en ${lugar}, ${anio}`,
    jovenes: (d, j, anio, pct) => (d.relacion === "contrario"
      ? `en ${anio} votó solo el ${pct(j)} de las personas de 18 a 29 años.`
      : `en ${anio} votó el ${pct(j)} de las personas de 18 a 29 años.`),
    jovenesQuien: "personas de 18 a 29 años",
    tituloUnidades: (quien, lugar, anio) => `100 ${quien} en ${lugar}: cuántas votaron en ${anio}`,
    sesentas: (d, pct) => `el grupo que más votó en ${d.anio} fue el de ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}).`,
    gruposSesentas: ["60–64", "65–69"],
    mayores: (d, pct) => (d.relacion === "coincide"
      ? `el grupo que menos votó en ${d.anio} fue el de 85 años o más (${pct(d.valor)}).`
      : `el grupo que menos votó en ${d.anio} fue el de ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}); el de 85 años o más votó ${pct(d.v85)}.`),
    tuGrupo: (g, v, lugar, anio, pct) => `En ${anio} tu grupo de edad, de ${TEXTOS.perfil.grupoLegible(g)}, votó ${pct(v)} en ${lugar}.`,
    anios: (g) => TEXTOS.perfil.grupoLegible(g),
    tituloGrupos: (lugar, anio) => `Participación por grupo de edad en ${lugar}, ${anio}`,
  },
  historiaVotante: {
    titulo: "Tu historia como votante",
    intro: (lugar) => `Estas son las elecciones federales en las que ya tenías edad para votar, y cómo votó la gente de tu edad en ${lugar}.`,
    introMenor: (lugar) => `Todavía no te ha tocado votar. Así votaron las personas de 18 años en ${lugar} en cada elección.`,
    introSinEdad: (lugar) => `Así votó ${lugar} en cada elección federal.`,
    tipo: (presidencial) => (presidencial ? "Elección presidencial" : "Elección intermedia"),
    tenias: (edad) => `Tenías ${edad} años.`,
    valor: (v, quien, lugar) => `Votaron ${v} de cada 100 ${quien} en ${lugar}.`,
    valorTotal: (v, lugar) => `Votaron ${v} de cada 100 personas en ${lugar}.`,
    proxima: (fecha) => `Tu próxima elección: ${fecha}.`,
    primera: (anio, esProxima, fecha) => `Tu primera elección federal: ${esProxima ? fecha : `la de ${anio}`}.`,
    porMarcar: "Esta casilla está vacía. ¿La vas a marcar?",
    columnas: ["Elección", "Tipo", "Edad", "Participación (de cada 100)"],
    fuente: (desde, hasta) => `Fuente: INE, Conteos Censales de Participación Ciudadana, ${desde}–${hasta}.`,
  },
  perfil: {
    titulo: "¿Cómo vota alguien como tú?",
    // grupo: "25 a 29 años", "85 años o más"
    grupoLegible: (g) => (g.includes("más") ? `${g.replace(" y más", "")} años o más` : `${g.replace("–", " a ")} años`),
    edadLegible: (e) => (e >= 85 ? "85 años o más" : `${e} años`),
    personas: "personas",
    tituloUnidades: (quien, lugar, anio) => `100 ${quien} en ${lugar}: cuántas votaron en ${anio}`,
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
    mensajeEdad: ({ edad, lugar, quien, valor, anio }) => `En ${anio} tenías ${edad} años. En ${lugar}, de cada 100 ${quien}, votaron ${valor}.`,
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
