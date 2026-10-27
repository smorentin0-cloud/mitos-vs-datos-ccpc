/*
 * Lenguas indígenas: náhuatl, maya y tseltal, las tres con más hablantes en México
 * (INEGI, Censo de Población y Vivienda 2020).
 *
 * BORRADOR: traducción preliminar hecha con inteligencia artificial, SIN revisión de hablantes.
 * La página lo dice siempre que se elige una de estas lenguas (#aviso-lengua). Antes de usarla con
 * comunidades debe revisarla y corregirla una persona hablante de cada lengua (por ejemplo, del
 * Padrón Nacional de Intérpretes y Traductores en Lenguas Indígenas del INALI).
 *
 * Se elige con ?lengua=nah|yua|tzh (es la versión pública de la página, como ?entidad=; no es un dato de la persona).
 * Se aplica sobre TEXTOS (textos.js), sobre el texto fijo de index.html (por selector) y sobre las frases
 * y niveles de los mitos (por id y por nombre). Lo que no está aquí se queda en español.
 * Las cifras nunca se escriben aquí: siguen llegando de los JSON que genera scripts/procesar.py.
 */
const Lengua = (() => {
  const LENGUAS = {
    nah: {
      lang: "nah",
      nombre: "náhuatl",
      propio: "Nawatl",
      variante: "forma general; no corresponde con certeza a una variante regional",
      textos: {
        veredictos: { cierto: "Melawak", falso: "Amo melawak" },
        juego: {
          pregunta: (n, total) => `Tlajtlanilistli ${n} ipan ${total}.`,
          contador: (n, total, puntos) => `Tlajtlanilistli ${n} ipan ${total}. Kualli: ${puntos}.`,
          cierto_o_falso: "¿Melawak noso amo melawak? Xikpejpena.",
          retroBien: (v) => `¡Kualli! ${v}.`,
          retroMal: (marcada, v) => `Otikpejpenki «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          siguiente: "Okse tlajtlanilistli",
          verResultado: "Xikita tlen otikchiw",
        },
        resultado: {
          titulo: (puntos, total) => `Kualli otikchiw ${puntos} ipan ${total}`,
          pasoContador: (n, total) => `${n} ipan ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Nochi kualli!";
            if (puntos >= total - 2) return `¡Kualli! Tikixmati kenijki tlapejpena ${lugar}.`;
            if (puntos >= total / 2) return "Kualli tiyaw. Sekin mitos ok mitskajkayawkej.";
            return "Axkan mitos otimitstlanijkej, pero axkan tikixmati datos.";
          },
        },
        portada: {
          titulo: (lugar) => `¿Akinmej tlapejpenaj ipan ${lugar}?`,
          juego: (n) => `Xikita tla melawak tlen tikneltoka: ${n} tlajtolmej, ¿melawak noso amo?`,
        },
        explorar: { ver: { total: "Nochimej", edad: "Ika xiwitl", sexo: "Siwamej wan tlakamej", seccion: "Milpan wan weyi altepetl" } },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Pewalis",
        '.nav-principal a[data-seccion="juego"] span': "Awiltilis",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "¿Kenijki motlapowa?",
        "#portada-entrada": "Tlen kiijtowa INE: akinmej otlapejpenkej 2009 hasta 2024. Xikpejpena kenijki tikitas.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Xiawilti: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Kentsi 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Xikita mapa",
        "#puerta-mapa-txt": "Xikita kenijki tlapejpenaj ipan moestado wan ipan momunicipio.",
        "#puerta-mapa-tiempo": "Kentsi 3 minutos",
        "#t-instr": "Kenijki moawiltia",
        ".pasos li:nth-child(1) > span:last-child": "Xikpowa tlajtolli. Sekin mitos, sekin melawak.",
        ".pasos li:nth-child(2) > span:last-child": "Xikpejpena: Melawak noso Amo melawak.",
        ".pasos li:nth-child(3) > span:last-child": "Xikita datos. Se tlajkuiloli mitsilwia tlen melawak.",
        '#instrucciones [data-ir="perfil"]': "Ma tipewakan",
        "#t-perfil-pantalla": "Achtowi: ¿akin tejwatsin ipan ni tlajtolli?",
        '#perfil .entrada': "Ika moxiw wan moestado, tikitas kenijki tlapejpenaj akinmej kemej tejwatsin.",
        'label[for="p-edad"]': "Keski xiwitl tikpiya",
        'label[for="p-estado"]': "Moestado",
        "#perfil-continuar": "Xiksentoka",
        "#perfil-no-decir": "Amo nikneki nikijtos",
        "#iniciar": "Ma tipewakan",
        '.opcion[data-respuesta="cierto"] span:last-child': "Melawak",
        '.opcion[data-respuesta="falso"] span:last-child': "Amo melawak",
        "#ver-en-mapa": "Xikita ni ipan mapa →",
        ".mas-contexto > summary": "Okachi tlajtolli",
        "#paso-siguiente": "Okse",
        "#paso-atras": "Xikmokuepa",
        ".invita-mapa button": "¿Wan ipan moestado? Xikita ipan mapa →",
        "#t-mapa": "Xikita motlal",
        "#mapa > .entrada": "Xikita kenijki otlapejpenkej ipan sesen estado wan municipio, 2009 hasta 2024.",
        "#tab-explorar": "Xikita",
        "#tab-recorrido": "Xinejnemi ipan regiones",
        ".mx-campo:nth-child(2) .campo-titulo": "Tlen tikitas",
        '#mx-estado option[value=""]': "Xikpejpena se estado",
        "#mx-indicacion": "Xikpejpena se estado ipan mapa noso ipan lista.",
        "#t-metodo": "¿Kenijki motlapowa?",
        "#metodo > .entrada": "Nochi tlapowalli kisa ipan san se fuente wan motlapowa san ijkon.",
      },
      niveles: {
        "Así vota México": { nombre: "Kenijki tlapejpena México", intro: "Achtowi: akinmej tlapejpenaj wan ipan katli elecciones." },
        "El primer voto": { nombre: "Achtowi tlapejpenalistli", intro: "Axkan, tlen okachi ipati: tlen panoa ijkuak tikasi 18 xiwitl." },
        "Que el primer voto no sea el último": { nombre: "Ma amo tlami ika achtowi tlapejpenalistli", intro: "¿Wan satepan? Ma tikitakan tlen panoa ika xiwitl." },
      },
      mitos: {
        sexo: "Tlakamej okachi tlapejpenaj ke siwamej.",
        campo: "Ipan milpan nochipa achi tlapejpenaj ke ipan weyi altepetl.",
        intermedias: "Ipan elecciones intermedias achi tlapejpenaj ke ipan elecciones presidenciales.",
        "primer-voto": "Akinmej kipiyaj 18 xiwitl achi tlapejpenaj ke promedio nacional.",
        jovenes: "Telpokamej wan ichpokamej amo tlapejpenaj.",
        sesentas: "Akinmej kipiyaj 60 hasta 69 xiwitl yejwan okachi tlapejpenaj.",
        mayores: "Akinmej kipiyaj 85 xiwitl noso okachi yejwan achi tlapejpenaj.",
        tendencia: "Ipan elecciones intermedias, tlapejpenalistli san temotok desde 2009.",
      },
    },

    yua: {
      lang: "yua",
      nombre: "maya",
      propio: "Maaya t'aan",
      variante: "maya peninsular (yucateco)",
      textos: {
        veredictos: { cierto: "Ja'aj", falso: "Ma' ja'ajil" },
        juego: {
          pregunta: (n, total) => `K'áatchi' ${n} ti' ${total}.`,
          contador: (n, total, puntos) => `K'áatchi' ${n} ti' ${total}. Ma'alob: ${puntos}.`,
          cierto_o_falso: "¿Ja'aj wa ma' ja'ajil? Yéey junp'éel.",
          retroBien: (v) => `¡Ma'alob! ${v}.`,
          retroMal: (marcada, v) => `Ta yéeyaj «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          siguiente: "Uláak' k'áatchi'",
          verResultado: "Il ba'ax ta beetaj",
        },
        resultado: {
          titulo: (puntos, total) => `Ma'alob ta núukaj ${puntos} ti' ${total}`,
          pasoContador: (n, total) => `${n} ti' ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Tuláakal ma'alob!";
            if (puntos >= total - 2) return `¡Ma'alob! A wojel bix u yéey ${lugar}.`;
            if (puntos >= total / 2) return "Ma'alob a bin. Wa jaytúul mitos tu tusikech.";
            return "Le mitoso'ob tu náajaltajo'ob, ba'ale' bejla'e' a wojel le datos.";
          },
        },
        portada: {
          titulo: (lugar) => `¿Máaxo'ob ku yéeyo'ob ich ${lugar}?`,
          juego: (n) => `Il wa ja'aj le ba'ax a tukultik: ${n} t'aan, ¿ja'aj wa ma'?`,
        },
        explorar: { ver: { total: "Tuláakal máak", edad: "Je'ex u ja'abil", sexo: "Ko'olelo'ob yéetel xiibo'ob", seccion: "Kool yéetel nojoch kaaj" } },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Káajbal",
        '.nav-principal a[data-seccion="juego"] span': "Báaxal",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "¿Bix u xo'okol?",
        "#portada-entrada": "U ts'íibil INE yóok'lal máax yéeyo'ob ichil 2009 tak 2024. Yéey bix a wilik.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Báaxal: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Bey 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Il le mapa",
        "#puerta-mapa-txt": "Il bix ku yéeyo'ob ich a estado yéetel ich a municipio.",
        "#puerta-mapa-tiempo": "Bey 3 minutos",
        "#t-instr": "Bix u báaxta'al",
        ".pasos li:nth-child(1) > span:last-child": "Xok le t'aano'. Wa jayp'éel mitos, wa jayp'éel ja'aj.",
        ".pasos li:nth-child(2) > span:last-child": "Yéey: Ja'aj wa Ma' ja'ajil.",
        ".pasos li:nth-child(3) > span:last-child": "Il le datos. Junp'éel séeyo yéetel junp'éel gráfica ku ye'esik ba'ax ja'aj.",
        '#instrucciones [data-ir="perfil"]': "Ko'ox káajsik",
        "#t-perfil-pantalla": "Ma'ili' k káajsik: ¿máax ech ich le tsikbala'?",
        '#perfil .entrada': "Yéetel a ja'abil yéetel a estado, yaan a wilik bix u yéey máaxo'ob je'ex teech.",
        'label[for="p-edad"]': "Jayp'éel a ja'abil",
        'label[for="p-estado"]': "A estado",
        "#perfil-continuar": "Bin táanil",
        "#perfil-no-decir": "Ma' in k'áat in wa'alik",
        "#iniciar": "Ko'ox káajsik",
        '.opcion[data-respuesta="cierto"] span:last-child': "Ja'aj",
        '.opcion[data-respuesta="falso"] span:last-child': "Ma' ja'ajil",
        "#ver-en-mapa": "Il lela' ichil le mapa →",
        ".mas-contexto > summary": "Uláak' ba'alo'ob",
        "#paso-siguiente": "Uláak'",
        "#paso-atras": "Suunaj",
        ".invita-mapa button": "¿Ka ich a estado? Il ichil le mapa →",
        "#t-mapa": "Il a lu'umil",
        "#mapa > .entrada": "Il bix yéeyo'ob ich kada estado yéetel municipio, 2009 tak 2024.",
        "#tab-explorar": "Il",
        "#tab-recorrido": "Xíimbal tu regionesil",
        ".mx-campo:nth-child(2) .campo-titulo": "Ba'ax a wilik",
        '#mx-estado option[value=""]': "Yéey junp'éel estado",
        "#mx-indicacion": "Yéey junp'éel estado ich le mapa wa ich le lista.",
        "#t-metodo": "¿Bix u xo'okol?",
        "#metodo > .entrada": "Tuláakal le xookilo'ob ku taal ti' junp'éel fuente yéetel ku xo'okol tu beel.",
      },
      niveles: {
        "Así vota México": { nombre: "Bix u yéey México", intro: "Yáax: máax ku yéey yéetel ichil ba'ax elecciones." },
        "El primer voto": { nombre: "U yáax yéeyaj", intro: "Bejla'e', u chúumuk le tsikbala': ba'ax ku yúuchul ken k'uchuk a 18 ja'abil." },
        "Que el primer voto no sea el último": { nombre: "Ma' u ts'o'okol yéetel u yáax yéeyaj", intro: "¿Ka'aj ts'o'ok le yáax yéeyajo'? Ko'ox ilik ba'ax ku yúuchul yéetel le ja'abo'obo'." },
      },
      mitos: {
        sexo: "Xiibo'ob ku yéeyo'ob asab ti' ko'olelo'ob.",
        campo: "Ich kool mantats' ma' ya'ab u yéeyo'ob je'ex ich nojoch kaaj.",
        intermedias: "Ichil le elecciones intermedias ma' ya'ab máak ku yéey je'ex ichil le presidenciales.",
        "primer-voto": "Le máaxo'ob yaan 18 u ja'abil ma' ya'ab u yéeyo'ob je'ex u promedio tuláakal México.",
        jovenes: "Táankelem máako'ob ma' tu yéeyo'ob.",
        sesentas: "Le máaxo'ob yaan 60 tak 69 u ja'abil, leti'ob asab ku yéeyo'ob.",
        mayores: "Le máaxo'ob yaan 85 wa asab u ja'abil, leti'ob ma' ya'ab ku yéeyo'ob.",
        tendencia: "Ichil le elecciones intermedias, u yéeyaj máak táan u éemel desde 2009.",
      },
    },

    tzh: {
      lang: "tzh",
      nombre: "tseltal",
      propio: "Bats'il k'op",
      variante: "forma general; sin variante regional verificada",
      textos: {
        veredictos: { cierto: "Melel", falso: "Ma' melel" },
        juego: {
          pregunta: (n, total) => `Sjojk'obil ${n} ta ${total}.`,
          contador: (n, total, puntos) => `Sjojk'obil ${n} ta ${total}. Lek: ${puntos}.`,
          cierto_o_falso: "¿Melel me ma' melel? Tsa' jun.",
          retroBien: (v) => `¡Lek! ${v}.`,
          retroMal: (marcada, v) => `La atsa' «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          siguiente: "Yan jojk'obil",
          verResultado: "Ila' bin la apas",
        },
        resultado: {
          titulo: (puntos, total) => `Lek la apas ${puntos} ta ${total}`,
          pasoContador: (n, total) => `${n} ta ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Spisil lek!";
            if (puntos >= total - 2) return `¡Lek! Ya ana' bit'il ya stsa' te ${lugar}.`;
            if (puntos >= total / 2) return "Lek ya xbajat. Jayeb mitos la slo'layat.";
            return "La sts'ikat te mitos, pero ya'yel ya ana' te datos.";
          },
        },
        portada: {
          titulo: (lugar) => `¿Mach'atik ya stsa'ik ta ${lugar}?`,
          juego: (n) => `Ila' me melel te bin ya ach'unbe: ${n} k'op, ¿melel me ma' melel?`,
        },
        explorar: { ver: { total: "Spisil ants winik", edad: "Ta sjabilal", sexo: "Antsetik sok winiketik", seccion: "K'altik sok muk'ul lum" } },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Sliwanel",
        '.nav-principal a[data-seccion="juego"] span': "Tajimal",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "Ajtayel",
        "#portada-entrada": "Te sjunal INE yu'un mach'atik la stsa'ik ta 2009 k'alal ta 2024. Tsa' bit'il ya awil.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Tajimal: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Ta 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Ila' te mapa",
        "#puerta-mapa-txt": "Ila' bit'il ya stsa'ik ta awestado sok ta amunicipio.",
        "#puerta-mapa-tiempo": "Ta 3 minutos",
        "#t-instr": "Bit'il ya yich' tajinel",
        ".pasos li:nth-child(1) > span:last-child": "Ilbe sk'oplal te k'ope. Jayeb mitos, jayeb melel.",
        ".pasos li:nth-child(2) > span:last-child": "Tsa': Melel me Ma' melel.",
        ".pasos li:nth-child(3) > span:last-child": "Ila' te datos. Jun sello sok jun gráfica ya yalbat bin melel.",
        '#instrucciones [data-ir="perfil"]': "Ya jlijkestik",
        "#t-perfil-pantalla": "Ba'yel: ¿mach'a ate ta k'op ini?",
        '#perfil .entrada': "Sok asjabilal sok awestado, ya awil bit'il ya stsa'ik te mach'atik jich bit'il ate.",
        'label[for="p-edad"]': "Jayeb asjabilal",
        'label[for="p-estado"]': "Awestado",
        "#perfil-continuar": "Ba'an to",
        "#perfil-no-decir": "Ma' ya jk'an ya jkal",
        "#iniciar": "Ya jlijkestik",
        '.opcion[data-respuesta="cierto"] span:last-child': "Melel",
        '.opcion[data-respuesta="falso"] span:last-child': "Ma' melel",
        "#ver-en-mapa": "Ila' ta mapa →",
        ".mas-contexto > summary": "Yan to k'op",
        "#paso-siguiente": "Yan",
        "#paso-atras": "Sutnan",
        ".invita-mapa button": "¿Sok ta awestado? Ila' ta mapa →",
        "#t-mapa": "Ila' te alumal",
        "#mapa > .entrada": "Ila' bit'il la stsa'ik ta jujun estado sok municipio, 2009 k'alal 2024.",
        "#tab-explorar": "Ila'",
        "#tab-recorrido": "Xanavan ta regiones",
        ".mx-campo:nth-child(2) .campo-titulo": "Bin ya awil",
        '#mx-estado option[value=""]': "Tsa' jun estado",
        "#mx-indicacion": "Tsa' jun estado ta mapa me ta lista.",
        "#t-metodo": "¿Bit'il ya yich' ajtayel?",
        "#metodo > .entrada": "Spisil te ajtayeletik ya xlok' ta jun nax fuente sok jun nax ya yich' ajtayel.",
      },
      niveles: {
        "Así vota México": { nombre: "Bit'il ya stsa' te México", intro: "Ba'yel: mach'atik ya stsa'ik sok ta bin elecciones." },
        "El primer voto": { nombre: "Sba tsa'el", intro: "Ya'yel, te yo'tan te k'ope: bin ya xk'ot ta pasel k'alal ya xk'ot 18 asjabilal." },
        "Que el primer voto no sea el último": { nombre: "Ma' me ja' xlaj ta sba tsa'el", intro: "¿Bin ya xk'ot ta pasel ta patil? Ya kiltik ta sjabilal." },
      },
      mitos: {
        sexo: "Te winiketik mas ya stsa'ik ta stojol te antsetik.",
        campo: "Ta k'altik spisil ora jutebxan ya stsa'ik ta stojol te muk'ul lum.",
        intermedias: "Ta elecciones intermedias jutebxan ya stsa'ik ta stojol te presidenciales.",
        "primer-voto": "Te mach'atik ay 18 sjabilal jutebxan ya stsa'ik ta stojol te promedio nacional.",
        jovenes: "Te kerem ach'ixetik ma' ya stsa'ik.",
        sesentas: "Te mach'atik ay 60 k'alal 69 sjabilal, ja' mas ya stsa'ik.",
        mayores: "Te mach'atik ay 85 sjabilal o mas, ja' jutebxan ya stsa'ik.",
        tendencia: "Ta elecciones intermedias, te tsa'el yakal ta yalel k'alal 2009.",
      },
    },
  };

  const pedida = new URLSearchParams(location.search).get("lengua");
  const L = LENGUAS[pedida] || null;

  // Copia sobre TEXTOS solo las claves traducidas; lo demás queda en español.
  function mezclar(destino, origen) {
    Object.entries(origen).forEach(([k, v]) => {
      if (v && typeof v === "object" && !Array.isArray(v) && typeof destino[k] === "object") mezclar(destino[k], v);
      else destino[k] = v;
    });
  }

  // Aviso en español (la versión revisada): qué lengua, que es un borrador, y de dónde salen los datos.
  function pintarAviso() {
    const caja = document.getElementById("aviso-lengua");
    if (!caja) return;
    caja.hidden = false;
    caja.querySelector(".aviso-lengua-titulo").textContent = TEXTOS.lenguas.titulo(L.propio, L.nombre);
    caja.querySelector(".aviso-lengua-texto").textContent = TEXTOS.lenguas.aviso(L.nombre, L.variante);
    caja.querySelector(".aviso-lengua-fuentes").textContent = TEXTOS.lenguas.fuentes;
    caja.querySelector("a").href = enlace("es");
  }

  // La misma página en otra lengua: conserva la edición (?entidad=), el reto y la sección (#mapa…).
  function enlace(clave) {
    const q = new URLSearchParams(location.search);
    if (clave === "es") q.delete("lengua");
    else q.set("lengua", clave);
    const busqueda = q.toString();
    return `${location.pathname}${busqueda ? `?${busqueda}` : ""}${location.hash}`;
  }

  // Selector del panel «Aa»: cambia ?lengua= y vuelve a cargar (conserva la edición, el reto y la sección).
  function prepararSelector() {
    const sel = document.getElementById("lengua");
    if (!sel) return;
    sel.value = L ? pedida : "es";
    sel.addEventListener("change", () => location.assign(enlace(sel.value)));
  }

  if (L) {
    mezclar(TEXTOS, L.textos);
    document.documentElement.lang = L.lang;
    Object.entries(L.html).forEach(([sel, texto]) => {
      document.querySelectorAll(sel).forEach((n) => { n.textContent = texto; });
    });
    pintarAviso();
  }
  prepararSelector();

  return {
    clave: L ? pedida : "es",
    // Frase del mito en la lengua elegida (el veredicto, las cifras y la explicación no cambian).
    mito: (m) => (L && L.mitos[m.id] ? { ...m, enunciado: L.mitos[m.id] } : m),
    nivel: (n) => (L && L.niveles[n.nombre] ? { ...n, ...L.niveles[n.nombre] } : n),
  };
})();
