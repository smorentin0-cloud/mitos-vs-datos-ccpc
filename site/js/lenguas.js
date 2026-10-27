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
 * Se traduce:
 *   - textos: claves de TEXTOS (textos.js) con la misma forma; lo que falta se queda en español.
 *   - html: texto fijo de index.html, por selector.
 *   - mitos y atlas: plantillas con {0}, {1}… para las cifras y {e0}, {e1}… para los nombres de estado.
 *     Las cifras NUNCA se escriben aquí: se toman, en orden, del texto en español que genera
 *     scripts/procesar.py (o procesar_atlas.py). Si no coinciden en número, se deja el texto en español.
 */
const Lengua = (() => {
  const LENGUAS = {
    // ------------------------------------------------------------------ náhuatl
    nah: {
      lang: "nah",
      metodoAtlas: "Tlapejpenalistli = akinmej otlapejpenkej ÷ (otlapejpenkej + amo otlapejpenkej) ipan lista nominal. Amo kalaki casillas especiales niman tlapejpenalistli tlen okse tlali. Regiones kichijkej tekitinij. Amo tiknextiaj grupos tlen kipiyaj achi ke {0},{1} akinmej ipan lista nominal.",
      nombre: "náhuatl",
      propio: "Nawatl",
      variante: "forma general; no corresponde con certeza a una variante regional",
      etiquetas: [
        [/^Mujeres$/, "Siwamej"], [/^Hombres$/, "Tlakamej"], [/^Rural$/, "Milpan"], [/^Urbana$/, "Weyi altepetl"],
        [/^Participación$/, "Tlapejpenalistli"], [/^Edad$/, "Xiwitl"], [/^(\d+) a (\d+) años$/, "$1 hasta $2 xiwitl"],
        [/^Promedio nacional$/, "Promedio ipan México"], [/^Promedio de (.+)$/, "Promedio ipan $1"], [/ años o más/, " xiwitl noso okachi"], [/ y más años/, " xiwitl noso okachi"], [/ años/, " xiwitl"],
      ],
      fuente: "Kampa kisa:",
      textos: {
        veredictos: { cierto: "Melawak", falso: "Amo melawak" },
        juego: {
          nivel: (n, total, nombre) => `Tlamantli ${n} ipan ${total}: ${nombre}`,
          pregunta: (n, total) => `Tlajtlanilistli ${n} ipan ${total}.`,
          contador: (n, total, puntos) => `Tlajtlanilistli ${n} ipan ${total}. Kualli: ${puntos}.`,
          cierto_o_falso: "¿Melawak noso amo melawak? Xikpejpena.",
          acierto: "¡Kualli!",
          retroBien: (v) => `¡Kualli! ${v}.`,
          retroMal: (marcada, v) => `Otikpejpenki «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          respuesta: (v) => `Tlananquililli: ${v}`,
          graficaMuestra: "Tlajkuiloli kinextia:",
          siguiente: "Okse tlajtlanilistli",
          verResultado: "Xikita tlen otikchiw",
        },
        resultado: {
          titulo: (puntos, total) => `Kualli otikchiw ${puntos} ipan ${total}`,
          paso2: "100 akinmej kemej tejwatsin",
          paso2Pais: "Kenijki otlapejpenki México",
          paso3: "Monemilis kemej tlapejpenani",
          paso3Estimaciones: "Tlen otikyolnemilij",
          pasoContador: (n, total) => `${n} ipan ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Nochi kualli!";
            if (puntos >= total - 2) return `¡Kualli! Tikixmati kenijki tlapejpena ${lugar}.`;
            if (puntos >= total / 2) return "Kualli tiyaw. Sekin mitos ok mitskajkayawkej.";
            return "Axkan mitos otimitstlanijkej, pero axkan tikixmati datos.";
          },
          resumen: (enunciado, v, acerto) => `${enunciado} Tlananquililli: ${v}. ${acerto ? "Kualli." : "Amo kualli."}`,
        },
        graficas: {
          sinDato: "amo onka dato", grupo: "Grupo", participacion: "Tlapejpenalistli", anio: "Xiwitl", tipo: "Kenijki",
          deCada100: "Ipan 100", votaron: "Otlapejpenkej", noVotaron: "Amo otlapejpenkej",
          unidades: (titulo, quien, si, no) => `${titulo}. Ipan 100 ${quien}, ${si} otlapejpenkej wan ${no} amo.`,
          leyendaSi: (n) => `Otlapejpenkej: ${n}`,
          leyendaNo: (n) => `Amo otlapejpenkej: ${n}`,
          resumenSerie: (d, x0, h, x1, min, xMin, max, xMax) => `${d} ipan ${x0}, ${h} ipan ${x1}; achi ${min} ipan ${xMin}, okachi ${max} ipan ${xMax}`,
        },
        portada: {
          titulo: (lugar) => `¿Akinmej tlapejpenaj ipan ${lugar}?`,
          juego: (n) => `Xikita tla melawak tlen tikneltoka: ${n} tlajtolmej, ¿melawak noso amo?`,
          edicion: (lugar) => `Edición ${lugar}: san tlajtolmej tlen melawak ipan ni estado.`,
          sinEdicion: "Ayamo onka ika ni estado; tiawiltia ika nochi México.",
        },
        compromiso: {
          opciones: {
            credencial: "Nikitas ma kualli nocredencial",
            votar: (anio) => `Nitlapejpenas ipan ${anio}`,
            invitar: "Nikinotsas seki tlen okse generación ma awiltikan",
          },
          elegido: (t) => `Motlanawatil: ${t}. Ya onka ipan motarjeta.`,
          tarjeta: "Notlanawatil:",
        },
        reto: {
          aviso: (p, t) => `Se tlakatl mitsnotsa: kipiyak ${p} ipan ${t}. ¿Tiktlanis?`,
          avisoEstado: (p, t, lugar) => `Se tlakatl mitsnotsa ipan edición ${lugar}: kipiyak ${p} ipan ${t}. ¿Tiktlanis?`,
        },
        tarjeta: {
          sello: "¿MITO NOSO DATO?", miResultado: "Tlen onikchiw", perfil: "Kenijki tlapejpenaj akinmej kemej na:",
          meGanas: "¿Tinechtlanis?", juegaEn: "Xiawilti ipan:", qr: "noso xikita código",
          descripcion: (p, t, perfil) => `Tarjeta: ${p} ipan ${t} kualli. ${perfil} ¿Tinechtlanis? Kipiya se código QR.`,
        },
        salon: { votar: "Xikejkuakan inmay: ¿melawak noso amo melawak?", paraConversar: "Ma titlajtokan:", terminar: "Ma tlami" },
        perfilPantalla: {
          estadosVisibles: (n) => `${n} estados ipan lista.`,
          ninguno: "Amo onka se estado ijkon.",
          errorEdad: (min, max) => `Xikijkuilo se xiwitl ${min} hasta ${max}, noso xikkawa.`,
          errorVacio: "Xikijkuilo moxiw noso xikpejpena moestado. Tla amo tikneki tikijtos, xikpejpena «Amo nikneki nikijtos».",
        },
        municipio: {
          visibles: (n) => `${n} municipios ipan lista.`,
          ninguno: "Amo onka se municipio ijkon.",
          final: (nombre, v, anio) => `Ipan momunicipio, ${nombre}, otlapejpenkej ${v} ipan 100 ipan ${anio}.`,
        },
        historia: {
          titulo: (edad, lugar) => (edad != null ? `Tikpiya ${edad} xiwitl${lugar ? ` wan tichanti ipan ${lugar}` : ""}.` : `Tichanti ipan ${lugar}.`),
          menor: (anio, esProxima, fecha) => `Ayamo weli titlapejpena. Moachtowi tlapejpenalis ${esProxima ? `ipan ${fecha}` : anio}.`,
          sinElecciones: (fecha) => `Ayamo mitsmonekiltia se tlapejpenalistli: moachtowi ipan ${fecha}.`,
          todas: (n, desde, hasta) => `Ipan nochi ${n} tlapejpenalistli (${desde} hasta ${hasta}) weliskia titlapejpenas.`,
          algunas: (primera, n, total) => `Achtowi weliskia titlapejpenas ipan ${primera}. Mitsmonekiltij ${n} ipan ${total} tlapejpenalistli.`,
          lugar: (l) => `Ipan sesen tlajtlanilistli tikitas kenijki tlapejpenaj akinmej kemej tejwatsin ipan ${l}.`,
          soloLugar: (l) => `Ipan sesen tlajtlanilistli tikitas kenijki tlapejpenaj ipan ${l}.`,
        },
        estimar: {
          pregunta: (q, l, a) => `Achtowi, xikyolnemili: ¿keski ipan 100 ${q} ipan ${l} otlapejpenkej ipan ${a}?`,
          preguntaGrupo: (q, l, a) => `Xiktlajtlani grupo: ¿keski ipan 100 ${q} ipan ${l} otlapejpenkej ipan ${a}?`,
          de18: "akinmej kipiyaj 18 xiwitl",
          deTuEdad: (e) => `akinmej kipiyaj ${e} xiwitl (kemej tejwatsin)`,
          de18a29: "akinmej kipiyaj 18 hasta 29 xiwitl",
          de60a69: "akinmej kipiyaj 60 hasta 69 xiwitl",
          unidad: "ipan 100",
          valorTexto: (v) => `${v} ipan 100`,
          resultado: (p, r) => (p === r ? `Otikyolnemilij ${p} wan melawak ${r}.` : `Otikyolnemilij ${p}; melawak ${r}.`),
          diferencia: (p, r) => {
            const d = r - p;
            if (d === 0) return " ¡Otikasik!";
            if (Math.abs(d) <= 3) return " ¡Kentsi otikasik!";
            return d > 0 ? ` Otlapejpenkej ${d} okachi.` : ` Otlapejpenkej ${-d} achi.`;
          },
          resultadoGrupo: (r) => `Melawak ${r} ipan 100.`,
          ahora: "Axkan, ¿melawak noso amo melawak?",
          tuEstimacion: "Tlen otikyolnemilij",
          datoReal: "Melawak dato",
          tituloGrafica: (q, l, a) => `Tlen otikyolnemilij wan melawak: ${q} ipan ${l}, ${a}`,
          resumen: (p) => `Tlen otikyolnemilij kentsi ${p} puntos ika melawak dato.`,
          item: (q, l, p, r) => `${q} ipan ${l}: otikyolnemilij ${p}, melawak ${r}.`,
        },
        enTuCaso: {
          titulo: "¿Wan tejwatsin?",
          igual: (l) => `Ipan ${l} san ijkon:`,
          distinto: (l) => `Ipan ${l} amo ijkon:`,
          empate: (l) => `Ipan ${l} kentsi san se:`,
          sexo: (m, h, a, pct) => `ipan ${a} otlapejpenkej ${pct(m)} siwamej wan ${pct(h)} tlakamej.`,
          mujeres: "Siwamej", hombres: "Tlakamej",
          tituloSexo: (l, a) => `Tlapejpenalistli ika siwamej wan tlakamej ipan ${l}, ${a}`,
          campoSinDatos: (l) => `Ipan ${l} amo miak milpan secciones ika titlanejneuis.`,
          campo: (d, pct) => ({
            coincide: `ipan se tlapejpenalistli milpan otlapejpenkej kemej noso okachi ke weyi altepetl. Ipan ${d.anio}: ${pct(d.rural)} milpan wan ${pct(d.urbana)} weyi altepetl.`,
            empate: `ipan ${d.anio} milpan wan weyi altepetl kentsi san se: ${pct(d.rural)} wan ${pct(d.urbana)}.`,
            contrario: `milpan achi otlapejpenkej ke weyi altepetl ipan nochi tlapejpenalistli. Ipan ${d.anio}: ${pct(d.rural)} milpan wan ${pct(d.urbana)} weyi altepetl.`,
          }[d.relacion]),
          rural: "Milpan", urbana: "Weyi altepetl",
          tituloCampo: (l, a) => `Tlapejpenalistli ipan milpan wan weyi altepetl ipan ${l}, ${a}`,
          intermedias: (d, pct) => {
            const i = `${d.intermedia[0]}, ${pct(d.intermedia[1])}`;
            const p = `${d.presidencial[0]}, ${pct(d.presidencial[1])}`;
            return {
              coincide: `intermedia kampa okachi (${i}) achi ke presidencial kampa achi (${p}).`,
              empate: `intermedia kampa okachi (${i}) kentsi kemej presidencial kampa achi (${p}).`,
              contrario: `intermedia ${d.intermedia[0]} (${pct(d.intermedia[1])}) okachi ke presidencial ${d.presidencial[0]} (${pct(d.presidencial[1])}).`,
            }[d.relacion];
          },
          presidencial: "Presidencial", intermedia: "Intermedia",
          tituloElecciones: (l) => `Tlapejpenalistli ipan ${l}`,
          tendencia: (d, pct) => {
            const s = d.intermedias.map(([a, v]) => `${pct(v)} ipan ${a}`).join(", ");
            return {
              coincide: `tlapejpenalistli otlejkok ipan sesen intermedia: ${s}.`,
              empate: `kentsi amo omopatlak: ${s}.`,
              contrario: `tlapejpenalistli otemok ipan se intermedia: ${s}.`,
            }[d.relacion];
          },
          tituloIntermedias: (l) => `Tlapejpenalistli ipan intermedias ipan ${l}`,
          municipioIgual: (m) => `Ipan ${m} san ijkon kemej ipan México:`,
          municipioDistinto: (m) => `Ipan ${m} amo ijkon kemej ipan México:`,
          municipioEmpate: (m) => `Ipan ${m} kentsi san se:`,
          municipioUmbral: (m, u) => `Ipan ${m} amo miakej ipan lista nominal (achi ke ${u.toLocaleString("es-MX")}); amo weli se kualli dato.`,
          municipioFaltan: (m) => `${m} amo kipiya nochi tlapejpenalistli; amo weli titlanejneuis.`,
          tituloEleccionesMunicipio: (m, e) => `Tlapejpenalistli ipan ${m} wan ${e}`,
          tituloIntermediasMunicipio: (m, e) => `Intermedias ipan ${m} wan ${e}`,
          primerVoto: (d, v18, prom, l, pct) => ({
            coincide: `akinmej kipiyaj 18 xiwitl otlapejpenkej ${pct(v18)}, okachi ke promedio ipan ${l} (${pct(prom)}).`,
            empate: `akinmej kipiyaj 18 xiwitl otlapejpenkej ${pct(v18)}; promedio ipan ${l}: ${pct(prom)}.`,
            contrario: `akinmej kipiyaj 18 xiwitl otlapejpenkej ${pct(v18)}, achi ke promedio ipan ${l} (${pct(prom)}).`,
          }[d.relacion]),
          tuEdad: (e, l, v, q, a) => `Ipan ${a} tikpiyaya ${e} xiwitl. Ipan ${l}, ipan 100 ${q}, otlapejpenkej ${v}.`,
          cuandoCumplas: (l, v, a) => `Ijkuak tikpiyas 18 xiwitl: ipan ${l}, ipan 100 akinmej kipiyaj 18 xiwitl, otlapejpenkej ${v} ipan ${a}.`,
          a18: (l) => `18 xiwitl ipan ${l}`,
          aTuEdad: (q, l) => `${q} ipan ${l}`,
          promedio: (l) => `Promedio ipan ${l}`,
          tituloEdad: (l, a) => `Tlapejpenalistli ika xiwitl ipan ${l}, ${a}`,
          jovenes: (d, j, a, pct) => `ipan ${a} otlapejpenkej ${pct(j)} akinmej kipiyaj 18 hasta 29 xiwitl.`,
          jovenesQuien: "akinmej kipiyaj 18 hasta 29 xiwitl",
          tituloUnidades: (q, l, a) => `100 ${q} ipan ${l}: keski otlapejpenkej ipan ${a}`,
          sesentas: (d, pct) => `akinmej okachi otlapejpenkej ipan ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}).`,
          mayores: (d, pct) => (d.relacion === "coincide"
            ? `akinmej achi otlapejpenkej ipan ${d.anio}: 85 xiwitl noso okachi (${pct(d.valor)}).`
            : `akinmej achi otlapejpenkej ipan ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}); 85 xiwitl noso okachi: ${pct(d.v85)}.`),
          tuGrupo: (g, v, l, a, pct) => `Ipan ${a} akinmej kemej tejwatsin, ${TEXTOS.perfil.grupoLegible(g)}, otlapejpenkej ${pct(v)} ipan ${l}.`,
          tituloGrupos: (l, a) => `Tlapejpenalistli ika xiwitl ipan ${l}, ${a}`,
        },
        historiaVotante: {
          titulo: "Monemilis kemej tlapejpenani",
          intro: (l) => `Kenijki otlapejpenkej akinmej kemej tejwatsin ipan ${l}, ipan sesen tlapejpenalistli.`,
          introMenor: (l) => `Kenijki otlapejpenkej akinmej kipiyaj 18 xiwitl ipan ${l}.`,
          introSinEdad: (l) => `Kenijki otlapejpenki ${l} ipan sesen tlapejpenalistli.`,
          tipo: (p) => (p ? "Presidencial" : "Intermedia"),
          tenias: (e) => `Tikpiyaya ${e} xiwitl.`,
          hitoEdad: (e) => `${e} xiwitl`,
          hitoValor: (v) => `${v} ipan 100`,
          hitoGrupo: (g) => `(grupo ${g})`,
          hitoPais: "(dato ipan México)",
          valor: (v, q, l) => `Otlapejpenkej ${v} ipan 100 ${q} ipan ${l}.`,
          valorTotal: (v, l) => `Otlapejpenkej ${v} ipan 100 ipan ${l}.`,
          proxima: (f) => `Mookse tlapejpenalis: ${f}.`,
          primera: (a, esP, f) => `Moachtowi tlapejpenalis: ${esP ? f : a}.`,
          porMarcar: "¿Tikmakas ni?",
          columnas: ["Tlapejpenalistli", "Kenijki", "Xiwitl", "Ipan 100"],
          fuente: (d, h) => `Kampa kisa: INE, Conteos Censales de Participación Ciudadana, ${d}–${h}.`,
        },
        perfil: {
          titulo: "¿Kenijki tlapejpenaj akinmej kemej tejwatsin?",
          grupoLegible: (g) => (g.includes("más") ? `${parseInt(g, 10)} xiwitl noso okachi` : `${g.replace("–", " hasta ")} xiwitl`),
          edadLegible: (e) => (e >= 85 ? "85 xiwitl noso okachi" : `${e} xiwitl`),
          personas: "akinmej",
          tituloUnidades: (q, l, a) => `100 ${q} ipan ${l}: keski otlapejpenkej ipan ${a}`,
          quien: (r) => `akinmej kipiyaj ${r.nivel === "grupo" ? TEXTOS.perfil.grupoLegible(r.grupo) : TEXTOS.perfil.edadLegible(r.edad)}`,
          nota: (r, lugarPedido) => {
            if (r.nivel === "grupo") return ` Ipan ${r.lugar} amo miakej kipiyaj ${TEXTOS.perfil.edadLegible(r.edad)}; ika ni tiktekitiltiaj grupo.`;
            if (r.nivel === "pais") return ` Ipan ${lugarPedido} amo miakej ika ni xiwitl; ika ni tiktekitiltiaj dato ipan México.`;
            return "";
          },
          todoPais: "Nochi México",
          todo: (e) => `Nochi ${e}`,
          mensajeEdad: ({ edad, lugar, quien, valor, anio }) => `Ipan ${anio} tikpiyaya ${edad} xiwitl. Ipan ${lugar}, ipan 100 ${quien}, otlapejpenkej ${valor}.`,
          mensaje: ({ lugar, grupo, valor, anio, menor }) => {
            const b = grupo ? `Ipan ${lugar}, ipan 100 akinmej kipiyaj ${grupo}, otlapejpenkej ${valor} ipan ${anio}.`
              : `Ipan ${lugar} otlapejpenkej ${valor} ipan 100 ipan ${anio}.`;
            return menor ? `Ijkuak tikpiyas 18 xiwitl: ${b}` : b;
          },
          comparaEstado: (e, ve, vp) => `Promedio ipan ${e}: ${ve} ipan 100; ipan México: ${vp} ipan 100.`,
          comparaPais: (vp) => `Promedio ipan México: ${vp} ipan 100.`,
          contexto: "Kenijki otlapejpenkej sesen grupo ipan México.",
          graficaTitulo: (a) => `Tlapejpenalistli ipan ${a}`,
          graficaGrupos: (a) => `Tlapejpenalistli ika xiwitl ipan nochi México, ${a}`,
          etiquetaGrupoLugar: (g, l) => `${g} ipan ${l}`,
          fuente: (a) => `Kampa kisa: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
        },
        mapa: {
          leyenda: (d, h) => (h == null ? `${d} noso okachi` : d == null ? `achi ke ${h}` : `${d} hasta ${h}`),
          tituloLeyenda: "Ipan 100, otlapejpenkej:",
          sinDato: "Amo onka dato (amo miakej)",
          deCada100: (v) => (v == null ? "amo onka dato" : `${Math.round(v)} ipan 100`),
        },
        explorar: {
          ver: { total: "Nochimej", edad: "Ika xiwitl", sexo: "Siwamej wan tlakamej", seccion: "Milpan wan weyi altepetl" },
          grupos: {
            edad: { "18": "18 xiwitl (achtowi tlapejpenalis)", "18–29": "18 hasta 29 xiwitl", "30–44": "30 hasta 44 xiwitl", "45–59": "45 hasta 59 xiwitl", "60–69": "60 hasta 69 xiwitl", "70–84": "70 hasta 84 xiwitl", "85 y más": "85 xiwitl noso okachi" },
            sexo: { Mujeres: "Siwamej", Hombres: "Tlakamej" },
            seccion: { Urbana: "Weyi altepetl", Mixta: "Secciones mixtas", Rural: "Milpan" },
          },
          quien: {
            total: "akinmej",
            edad: { "18": "akinmej kipiyaj 18 xiwitl", "18–29": "akinmej kipiyaj 18 hasta 29 xiwitl", "30–44": "akinmej kipiyaj 30 hasta 44 xiwitl", "45–59": "akinmej kipiyaj 45 hasta 59 xiwitl", "60–69": "akinmej kipiyaj 60 hasta 69 xiwitl", "70–84": "akinmej kipiyaj 70 hasta 84 xiwitl", "85 y más": "akinmej kipiyaj 85 xiwitl noso okachi" },
            sexo: { Mujeres: "siwamej", Hombres: "tlakamej" },
            seccion: { Urbana: "akinmej ipan weyi altepetl", Mixta: "akinmej ipan secciones mixtas", Rural: "akinmej ipan milpan" },
          },
          anio: (a, p) => `${a} (${p ? "presidencial" : "intermedia"})`,
          titulo: (q, a) => `Ipan 100 ${q}, keski otlapejpenkej ipan ${a}`,
          estadoNombre: (n, v, d) => `${n}: ${TEXTOS.mapa.deCada100(v)}${v == null ? "" : d === 0 ? ", kemej México" : `, ${Math.abs(d)} ${d > 0 ? "okachi" : "achi"} ke México`}`,
          frase: (l, v, q, a, n, ref) => {
            const d = Math.round(v) - Math.round(n);
            const c = d === 0 ? `Kemej promedio ${ref} (${Math.round(n)}).` : `${Math.abs(d)} ${d > 0 ? "okachi" : "achi"} ke promedio ${ref} (${Math.round(n)}).`;
            return `Ipan ${a} otlapejpenkej ${Math.round(v)} ipan 100 ${q} ipan ${l}. ${c}`;
          },
          lugar: (n, t) => `Kipiya ${n} ipan ${t} estados.`,
          sinDato: (l) => `Ipan ${l} amo miakej ipan ni grupo; amo weli se kualli dato.`,
          soloTotal: "Ika municipio san onka dato ika nochimej.",
          munSinDato: (m) => `${m} amo kipiya miakej ipan lista nominal, noso amo onkaya; amo weli se kualli dato.`,
          tituloSerie: (q, d, h) => `Ipan 100 ${q}, keski otlapejpenkej ${d} hasta ${h}`,
          pais: "México", delPais: "ipan México", deLugar: (n) => `ipan ${n}`,
          colEstado: "Estado", colMunicipio: "Municipio", colValor: "Ipan 100", colDifCon: (r) => `Ika ${r}`,
          ordenar: (c) => `Xiktlali ika ${c.toLowerCase()}`,
          tablaEstados: "Xikita nochi estados ipan se tabla",
          tablaMunicipios: (e) => `Xikita municipios ipan ${e}`,
          fuente: (a) => `Kampa kisa: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
          copiado: "Otikopiaj enlace.",
          copiaManual: (u) => `Xikopiaro: ${u}`,
          miEstado: (n) => `Xikita noestado (${n})`,
          municipio: { visibles: (n) => `${n} municipios.`, ninguno: "Amo onka." },
        },
        atlas: {
          pct: (v) => (v == null ? "amo onka dato" : `${v.toFixed(1)}%`),
          puntos: (v) => `${Math.abs(v).toFixed(1)} puntos`,
          error: "Amo weli motemowa mapa.",
          escuchar: "Xikkaki",
          mapa: {
            tituloPais: "Tlapejpenalistli ika estado",
            anio: (a, p) => `${a} · ${p ? "presidencial" : "intermedia"}`,
            desc: (t, a, lista) => `Mapa ipan México. ${t}, ${a}. ${lista}`,
            listaEstados: (f) => `${f.map(([n, v]) => `${n}: ${v == null ? "amo onka dato" : `${v.toFixed(1)}%`}`).join("; ")}.`,
          },
          pasos: {
            regionesTitulo: "Chikwasen regiones",
            regionesTexto: "Ika tinejnemis ipan México, tiksentilijkej estados ipan chikwasen regiones.",
            regionEtiqueta: (n, t) => `Región ${n} ipan ${t}`,
            tablaEstados: "Xikita estados ipan se tabla",
            colEstado: "Estado",
            colVoto: (a) => `Otlapejpenkej ipan ${a}`,
          },
          compara: {
            frase: (e, a, d, l) => `Ipan ${a}, ${e} otlapejpenki ${Math.abs(d) < 0.05 ? "kemej México" : `${TEXTOS.atlas.puntos(d)} ${d > 0 ? "okachi" : "achi"} ke México`}; kipiya ${l} ipan 32 estados.`,
            votoEn: (e, a) => `otlapejpenkej ipan ${e} ipan ${a}`,
            tituloHistoria: (d, h) => `Tlapejpenalistli ${d}–${h}`,
            tituloEdad: (a) => `Ika xiwitl, ${a}`,
            tituloSexo: (a) => `Siwamej wan tlakamej, ${a}`,
            tituloSeccion: (a) => `Milpan wan weyi altepetl, ${a}`,
            fraseEdad: (e, g, d) => `Kampa okachi amo kemej México: akinmej kipiyaj ${TEXTOS.perfil.grupoLegible(g)}; ipan ${e} otlapejpenkej ${TEXTOS.atlas.puntos(d)} ${d > 0 ? "okachi" : "achi"}.`,
            colGrupo: "Grupo", colAnio: "Tlapejpenalistli", nacional: "México", sinDato: "Amo onka dato",
          },
        },
        metodo: {
          umbral: (n) => `Amo tiknextiaj se grupo ijkuak kipiya achi ke ${n.toLocaleString("es-MX")} akinmej ipan lista nominal: amo kualli dato. Ijkuak ijkon, tikitas «amo onka dato».`,
          nota: "Tlapejpenalistli = akinmej otlapejpenkej ÷ (akinmej otlapejpenkej + akinmej amo otlapejpenkej), ika lista nominal. Amo kalaki casillas especiales niman tlapejpenalistli tlen okse tlali.",
        },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Pewalis",
        '.nav-principal a[data-seccion="juego"] span': "Awiltilis",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "¿Kenijki motlapowa?",
        "#t-lectura": "Kenijki tikpowas",
        "#portada-entrada": "Tlen kiijtowa INE: akinmej otlapejpenkej 2009 hasta 2024. Xikpejpena kenijki tikitas.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Xiawilti: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Kentsi 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Xikita mapa",
        "#puerta-mapa-txt": "Xikita kenijki tlapejpenaj ipan moestado wan ipan momunicipio.",
        "#puerta-mapa-tiempo": "Kentsi 3 minutos",
        '.enlaces-portada [data-ir="talleres"]': "¿Titemachtia? Modo salón wan amatl →",
        "#t-talleres": "Ika temachtilistli",
        "#talleres .entrada": "Ika tiawiltiskej miakej ika se proyector, noso ipan amatl.",
        ".opcion-taller:nth-of-type(1) h3": "Modo salón",
        ".opcion-taller:nth-of-type(1) p": "Se tlajtlanilistli ipan sesen pantalla wan miakej tlapejpenaj ika inmay.",
        "#entrar-salon": "Ma pewa modo salón",
        ".opcion-taller:nth-of-type(2) h3": "Ika tikixkopinas",
        ".opcion-taller:nth-of-type(2) p": "Tarjetas ika tlajtolli wan tlananquililli.",
        ".opcion-taller:nth-of-type(2) a": "Xiktlapo ika tikixkopinas",
        ".opcion-taller:nth-of-type(3) h3": "Guía",
        ".opcion-taller:nth-of-type(3) p": "Se temachtilistli 20 minutos (ipan español).",
        ".opcion-taller:nth-of-type(3) a": "Xikpowa guía",
        '#talleres [data-ir="portada"]': "Xikmokuepa",
        "#t-instr": "Kenijki moawiltia",
        ".pasos li:nth-child(1) > span:last-child": "Xikpowa tlajtolli. Sekin mitos, sekin melawak.",
        ".pasos li:nth-child(2) > span:last-child": "Xikpejpena: Melawak noso Amo melawak.",
        ".pasos li:nth-child(3) > span:last-child": "Xikita datos. Se tlajkuiloli mitsilwia tlen melawak.",
        ".nota-papel p": "¿Tlen tlapejpenalistli? Keski tlakamej ipan 100 oyajkej tlapejpenaj. Tla kiijtowa 60%, otlapejpenkej 60 ipan 100.",
        '#instrucciones [data-ir="perfil"]': "Ma tipewakan",
        "#t-perfil-pantalla": "Achtowi: ¿akin tejwatsin ipan ni tlajtolli?",
        "#perfil .entrada": "Ika moxiw wan moestado, tikitas kenijki tlapejpenaj akinmej kemej tejwatsin.",
        'label[for="p-edad"]': "Keski xiwitl tikpiya",
        "#edad-ayuda": "15 hasta 100 xiwitl.",
        'label[for="p-estado"]': "Moestado",
        ".privacidad span": "Amo tikpiaj wan amo tiktitlanij motlananquilis.",
        "#perfil-continuar": "Xiksentoka",
        "#perfil-no-decir": "Amo nikneki nikijtos",
        "#momento .folio": "Monemilis",
        "#iniciar": "Ma tipewakan",
        '#momento [data-ir="perfil"]': "Nikpatlas notlajtol",
        '.opcion[data-respuesta="cierto"] span:last-child': "Melawak",
        '.opcion[data-respuesta="falso"] span:last-child': "Amo melawak",
        "#est-ver": "Xikita dato",
        "#ver-en-mapa": "Xikita ni ipan mapa →",
        ".mas-contexto > summary": "Okachi tlajtolli",
        "#discusion strong": "Ma titlajtokan:",
        ".g-tabla > summary": "Xikita datos ipan se tabla",
        "#paso-siguiente": "Okse",
        "#paso-atras": "Xikmokuepa",
        "#paso-1 .plegable summary": "Motlananquilis",
        ".invita-mapa button": "¿Wan ipan moestado? Xikita ipan mapa →",
        "#estimaciones summary": "Xikita sesen",
        "#t-paso-4": "Motlanawatil wan motarjeta",
        "#t-compromiso": "Xikpejpena se tlanawatilli:",
        "#compartir": "Xikmaka motarjeta",
        "#descargar": "Xiktemowi",
        "#reto-generacion": "Xiknotsa se tlakatl tlen okse generación",
        "#copiar": "Xikopiaro enlace",
        "#paso-4 .enlaces-portada a": "INE",
        '#paso-4 [data-ir="mapa"]': "Xikita mapa",
        ".jugar-otra": "Ma tiawiltikan okseppa",
        ".llamado li:nth-child(1)": "Xikixmati ipan fuentes oficiales achtowi tikmakas se tlapowalli.",
        ".llamado li:nth-child(2)": "Xikita ma kualli mocredencial ika titlapejpenas.",
        ".llamado li:nth-child(3)": "Xitlapejpena ipan sesen tlapejpenalistli.",
        "#cierre .boton.primario": "INE",
        '#cierre [data-ir="mapa"]': "Xikita mapa",
        "#cierre .enlace-imprimible": "Ika tikixkopinas",
        "#t-mapa": "Xikita motlal",
        "#mapa > .entrada": "Xikita kenijki otlapejpenkej ipan sesen estado wan municipio, 2009 hasta 2024.",
        "#volver-juego": "← Xikmokuepa ipan awiltilis",
        "#tab-explorar": "Xikita",
        "#tab-recorrido": "Xinejnemi ipan regiones",
        ".mx-campo:nth-child(1) .campo-titulo": "Tlapejpenalistli",
        ".mx-campo:nth-child(2) .campo-titulo": "Tlen tikitas",
        ".mx-campo:nth-child(3) .campo-titulo": "Grupo",
        "#mx-ayuda": "Xikpejpena se estado ipan mapa, noso ika teclado (flechas wan Enter), noso ipan lista.",
        "#mx-leyenda-t": "Ipan 100, otlapejpenkej:",
        "#mx-pais": "Xikita nochi México",
        'label[for="mx-estado"]': "Estado",
        '#mx-estado option[value=""]': "Xikpejpena se estado",
        "#mx-mi-edad": "Xikita akinmej kemej na",
        'label[for="mx-municipio"]': "Xiktemo se municipio",
        "#mx-indicacion": "Xikpejpena se estado ipan mapa noso ipan lista.",
        "#mx-ponte": "¿Tikixmati moestado? Xikita →",
        "#mx-mas": "Xikita ika xiwitl, siwamej wan tlakamej →",
        "#mx-copiar": "Xikopiaro enlace",
        "#panel-recorrido > .entrada": "¿Kampa okachi tlapejpenaj ipan México? Xitemo yolik: mapa nejnemi ipan sesen región wan ipan moestado.",
        "#panel-recorrido > p > [data-a-compara]": "Xikita moestado axkan",
        "#a-t-portada": "Tlapejpenalistli ipan México",
        ".at-paso-portada .at-texto": "Se ojtli ipan mapa: nochi México, sesen región wan moestado.",
        "#a-t-final": "¿Wan moestado?",
        ".at-paso-final > p:not([id])": "Xikpejpena moestado wan tikitas kenijki tlapejpena. Amo tikpiaj tlen tikpejpenas.",
        'label[for="a-elige-estado"]': "Moestado",
        '#a-elige-estado option[value=""]': "Xikpejpena se estado",
        '#a-elige-estado-2 option[value=""]': "Xikpejpena se estado",
        "#a-ir-compara": "Xikita ika México →",
        "#a-t-compara": "Moestado wan México",
        "#a-compara-vacio": "Xikpejpena moestado:",
        'label[for="a-elige-estado-2"]': "Estado",
        ".at-compara-controles span.at-campo-titulo": "Tlapejpenalistli",
        "#t-metodo": "¿Kenijki motlapowa?",
        "#metodo > .entrada": "Nochi tlapowalli kisa ipan san se fuente wan motlapowa san ijkon.",
        "#metodo h3:nth-of-type(1)": "Tlapejpenalistli",
        "#metodo p:nth-of-type(3)": "Tikijtowaj «ipan 100»: tla otlapejpenkej 60%, otlapejpenkej 60 ipan 100.",
        "#metodo h3:nth-of-type(2)": "Kampa kisa",
        "#metodo p:nth-of-type(4)": "INE, Conteos Censales de Participación Ciudadana, 2009 hasta 2024. Datos abiertos; amo onka datos tlen se tlakatl.",
        "#metodo h3:nth-of-type(3)": "Amo miakej",
        "#metodo h3:nth-of-type(4)": "Lenguas indígenas",
        "#metodo h3:nth-of-type(5)": "Tlen amo tikpiaj",
        "#metodo p:nth-of-type(7)": "Moxiw, moestado, momunicipio wan motlananquilis san onkaj ipan ni página. Amo tikpiaj, amo tiktitlanij.",
      },
      niveles: {
        "Así vota México": { nombre: "Kenijki tlapejpena México", intro: "Achtowi: akinmej tlapejpenaj wan ipan katli elecciones." },
        "El primer voto": { nombre: "Achtowi tlapejpenalistli", intro: "Axkan, tlen okachi ipati: tlen panoa ijkuak tikasi 18 xiwitl." },
        "Que el primer voto no sea el último": { nombre: "Ma amo tlami ika achtowi tlapejpenalistli", intro: "¿Wan satepan? Ma tikitakan tlen panoa ika xiwitl." },
      },
      cierre: {
        titulo: "Ma moachtowi tlapejpenalis amo tlami",
        texto: "Ijkuak tikpiya {0} xiwitl okachi titlapejpena ke promedio nacional, pero satepan temo hasta kentsi {1} xiwitl. Ma moachtowi tlapejpenalis amo tlami.",
      },
      mitos: {
        sexo: {
          enunciado: "Tlakamej okachi tlapejpenaj ke siwamej.",
          resumen: "Siwamej okachi otlapejpenkej ke tlakamej ipan nochi {0} tlapejpenalistli desde {1}. San ijkuak kipiyaj {2} xiwitl, tlakamej achi okachi otlapejpenkej.",
          explicacion: "Siwamej okachi otlapejpenkej ke tlakamej ipan nochi {0} tlapejpenalistli desde {1}. Ipan {2} otlapejpenkej {3} siwamej wan {4} tlakamej. San ijkuak kipiyaj {5} xiwitl, tlakamej achi okachi otlapejpenkej.",
          dato: "siwamej otlapejpenkej ipan {0}; tlakamej, {1}.",
          discusion: "¿Tleka miakej kineltokaj ke tlakamej okachi tlapejpenaj? ¿Tleka siwamej okachi tlapejpenaj?",
          grafica: { titulo: "Tlapejpenalistli ika siwamej wan tlakamej, {0}", nota: ["Ipan {0} achtowi motlalij no binaria ({1}); amo kalaki ipan ni.", "Ipan {0} achtowi motlalij no binaria; amo kalaki ipan ni."] },
        },
        campo: {
          enunciado: "Ipan milpan nochipa achi tlapejpenaj ke ipan weyi altepetl.",
          resumen: "Ipan nochi {0} tlapejpenalistli, milpan otlapejpenkej kemej noso okachi ke weyi altepetl. Ipan {1} kentsi san se: {2} wan {3}.",
          explicacion: "Desde {0}, ipan nochi tlapejpenalistli, milpan otlapejpenkej kemej noso okachi ke ipan weyi altepetl. Ipan {1}, otlapejpenkej {2} ipan milpan wan {3} ipan weyi altepetl. Ipan {4} kentsi san se: {5} wan {6}.",
          dato: "otlapejpenkej ipan milpan ipan {0}; ipan weyi altepetl, {1}.",
          discusion: "¿Tlen kipalewia noso kitlajyowiltia tlapejpenalis ipan se milpan altepetl? ¿Wan ipan se weyi altepetl?",
          grafica: { titulo: "Tlapejpenalistli ipan milpan wan weyi altepetl, {0}", nota: "INE kitlalia katli milpan wan katli weyi altepetl. Amo monextia secciones mixtas." },
        },
        intermedias: {
          enunciado: "Ipan elecciones intermedias achi tlapejpenaj ke ipan elecciones presidenciales.",
          resumen: "Ipan {0} intermedias achi otlapejpenkej ke ipan nochi presidenciales. Ipan intermedias mopejpenaj diputados, amo presidente.",
          explicacion: "Ipan {0} intermedias achi otlapejpenkej ke ipan {1} presidenciales: intermedia kampa okachi otlapejpenkej ({2}, {3}) achi ke presidencial kampa achi otlapejpenkej ({4}, {5}). Ipan intermedias mopejpenaj diputados, amo presidente.",
          dato: "otlapejpenkej ipan intermedia kampa okachi ({0}). Presidencial kampa achi kipiyak {1} ({2}).",
          discusion: "¿Tikixmatiyaj tlen mopejpena ipan se elección intermedia? ¿Tleka achi kitlachiliaj?",
          grafica: { titulo: "Tlapejpenalistli ipan nochi México, {0}" },
        },
        "primer-voto": {
          enunciado: "Akinmej kipiyaj 18 xiwitl achi tlapejpenaj ke promedio nacional.",
          resumen: "Ijkuak kipiyaj {0} xiwitl okachi tlapejpenaj ke promedio nacional, ipan nochi {1} tlapejpenalistli. Satepan temo hasta {2} ijkuak kipiyaj {3} xiwitl.",
          explicacion: "Ijkuak kipiyaj {0} xiwitl okachi tlapejpenaj ke promedio nacional, ipan nochi {1} tlapejpenalistli desde {2}. Ipan {3} otlapejpenkej {4} akinmej kipiyayaj {5} xiwitl; promedio nacional: {6}. Satepan temo: asi {7} ijkuak kipiyaj {8} xiwitl wan satepan okseppa tlejko.",
          dato: "otlapejpenkej akinmej kipiyayaj {0} xiwitl ipan {1}. Promedio nacional: {2}.",
          discusion: "¿Tlen kilnamikij noso kiyolnemiliaj ika inachtowi tlapejpenalis? ¿Tleka ijkuak kipiyaj {0} xiwitl okachi tlapejpenaj?",
          grafica: { titulo: "Tlapejpenalistli ika xiwitl, {0} hasta {1} xiwitl, {2}" },
        },
        jovenes: {
          enunciado: "Telpokamej wan ichpokamej amo tlapejpenaj.",
          resumen: "Yejwan {0} tlakamej. Achi tlapejpenaj ke akinmej kipiyaj {1} xiwitl noso okachi ({2}), pero tlapejpenaj.",
          explicacion: "Ipan {0} otlapejpenkej {1} akinmej kipiyaj {2} hasta {3} xiwitl: {4} tlakamej. Desde {5} amo keman otlapejpenkej achi ke se ipan eyi (achi: {6} ipan {7}). Achi tlapejpenaj ke akinmej kipiyaj {8} xiwitl noso okachi ({9} ipan {10}).",
          dato: "akinmej kipiyaj {0} hasta {1} xiwitl otlapejpenkej ipan {2}.",
          discusion: "¿Tleka se telpochtli noso ichpochtli amo okseppa tlapejpena satepan iachtowi tlapejpenalis? ¿Tlen kipalewis ma tlapejpena?",
          grafica: { titulo: "Tlapejpenalistli ika xiwitl, {0}" },
        },
        sesentas: {
          enunciado: "Akinmej kipiyaj 60 hasta 69 xiwitl yejwan okachi tlapejpenaj.",
          resumen: "Ipan nochi {0} tlapejpenalistli, akinmej okachi otlapejpenkej kipiyayaj {1} hasta {2} xiwitl. Promedio nacional: {3}.",
          explicacion: "Ipan nochi {0} tlapejpenalistli desde {1}, akinmej okachi otlapejpenkej kipiyayaj {2} hasta {3} xiwitl. Ipan {4} yejwan akinmej kipiyayaj {5} xiwitl, ika {6}, okachi ke promedio nacional ({7}).",
          dato: "otlapejpenkej akinmej kipiyayaj {0} xiwitl ipan {1}.",
          discusion: "¿Tlen kostumbres kichiwa ma se tlakatl tlapejpena nochi inemilis?",
          grafica: { titulo: "Akinmej okachi otlapejpenkej ipan sesen tlapejpenalistli" },
        },
        mayores: {
          enunciado: "Akinmej kipiyaj 85 xiwitl noso okachi yejwan achi tlapejpenaj.",
          resumen: "Yejwan achi otlapejpenkej ipan nochi {0} tlapejpenalistli. Amo miakej: {1} ipan lista nominal.",
          explicacion: "Ipan nochi {0} tlapejpenalistli desde {1}, akinmej kipiyaj {2} xiwitl noso okachi achi otlapejpenkej. Ipan {3} otlapejpenkej {4}; akinmej kipiyaj {6} xiwitl, {5}. Amo miakej: {7} ipan lista nominal.",
          dato: "otlapejpenkej akinmej kipiyaj {0} xiwitl noso okachi ipan {1}.",
          discusion: "¿Tlen tlaixkuitlalistli kipiya se tlakatl ika {0} xiwitl noso okachi ika tlapejpenas? ¿Kenijki tikpalewiskej?",
          grafica: { titulo: "Tlapejpenalistli ika xiwitl, {0}" },
        },
        tendencia: {
          enunciado: "Ipan elecciones intermedias, tlapejpenalistli san temotok desde 2009.",
          resumen: "Sesen intermedia okachi otlapejpenkej ke achtowi. Ika kualli titlanejneuis, xikita tlapejpenalistli san se kenijki.",
          explicacion: "Sesen elección intermedia okachi otlapejpenkej ke achtowi. Otlapejpenkej {0} ipan {1}, {2} ipan {3} wan {4} ipan {5}. Ika kualli titlanejneuis xikita tlapejpenalistli san se kenijki, pampa ipan presidenciales nochipa okachi tlapejpenaj.",
          dato: "otlapejpenkej ipan intermedia {0}; ipan {2}, {1}.",
          discusion: "Tla tlapejpenalistli ipan intermedias weli tlejko, ¿tlen weli ankichiwaj ma okseppa tlejko?",
          grafica: { titulo: "Tlapejpenalistli ipan elecciones intermedias" },
        },
      },
      atlas: {
        pais: { titulo: "México, {0}", texto: "Ipan {0} otlapejpenkej {1} akinmej ipan lista nominal. Pero ni promedio kitlatia se México tlen amo san se ipan nochi kampa." },
        extremos: { titulo: "Amo nochi México san se tlapejpena", texto: "Ipan {0}, {e0} okachi otlapejpenki ({1}) wan {e1} achi ({2}): {3} puntos." },
        intermedia: { titulo: "Amo onka presidencial, achi tlapejpenaj", texto: "Ipan {0}, amo onkaya presidencial, otlapejpenkej {1}: {2} puntos achi ke ipan {3}. Otemok ipan {4} ipan {5} estados." },
        noroeste: { titulo: "Región kampa achi tlapejpenaj", texto: "Ipan {0} ipan {1} elecciones desde {2}, Noroeste kampa achi otlapejpenkej. Ipan {3} otlapejpenkej {4}, {5} puntos achi ke México.", extra: "Itelpokawan ({0} hasta {1} xiwitl) achi tlapejpenaj ipan chikwasen regiones: {2} ipan {3}." },
        norte: { titulo: "Amo san se", texto: "Ipan {0}, {e0} otlapejpenki {1} wan {e1} {2}: {3} puntos ipan san se región.", extra: "{e0} kipiya {0} ipan {1} wan {e1}, {2}." },
        occidente: { titulo: "Telpokamej wan wewejtsitsin, okachi kemej", texto: "Nikan telpokamej wan wewejtsitsin tlapejpenaj okachi kemej: ipan {0}, {1} akinmej kipiyaj {2} hasta {3} xiwitl wan {4} akinmej kipiyaj {5} xiwitl noso okachi; {6} puntos.", extra: "Ipan nochi México, {0} puntos." },
        centro: { titulo: "Región kampa okachi tlapejpenaj", texto: "Centro kampa okachi otlapejpenkej ipan {0}: {1}, {2} puntos okachi ke México.", extra: "Nikan onka {e0}, san ni estado kampa okachi otlapejpenkej ipan intermedia {0} ({1}) ke ipan presidencial {2} ({3})." },
        sur: { titulo: "Milpan okachi tlapejpena", texto: "Ipan Sur, milpan okachi tlapejpenaj ke weyi altepetl: {0} wan {1} ipan {2}.", extra: "Ipan {0} achi otlapejpenkej ({1}); ipan {2} otlapejpenkej {3}." },
        golfo: { titulo: "{e0} achtowi", texto: "{e0} okachi otlapejpenki ipan {0} ipan {1} elecciones desde {2}; ipan {3} otlapejpenki {4}.", extra: "Nochi región otlapejpenki {0} ipan {1}, okachi ke México." },
      },
    },

    // ------------------------------------------------------------------ maya
    yua: {
      lang: "yua",
      metodoAtlas: "Yéeyaj = máaxo'ob tu yéeyo'ob ÷ (tu yéeyo'ob + ma' tu yéeyo'obi') ich le lista nominal. Ma' táaka'an casillas especiales mix u yéeyaj tu láak' lu'umil. Le regiones tu beetaj le múuch' meyajo'. Ma' k ye'esik múuch'o'ob yaan ma' tu k'uchul {0},{1} máak ich le lista nominal.",
      nombre: "maya",
      propio: "Maaya t'aan",
      variante: "maya peninsular (yucateco)",
      etiquetas: [
        [/^Mujeres$/, "Ko'olelo'ob"], [/^Hombres$/, "Xiibo'ob"], [/^Rural$/, "Kool"], [/^Urbana$/, "Nojoch kaaj"],
        [/^Participación$/, "Yéeyaj"], [/^Edad$/, "Ja'ab"], [/^(\d+) a (\d+) años$/, "$1 tak $2 ja'ab"],
        [/^Promedio nacional$/, "U promedio México"], [/^Promedio de (.+)$/, "U promedio $1"], [/ años o más/, " ja'ab wa asab"], [/ y más años/, " ja'ab wa asab"], [/ años/, " ja'ab"],
      ],
      fuente: "Tu'ux u taal:",
      textos: {
        veredictos: { cierto: "Ja'aj", falso: "Ma' ja'ajil" },
        juego: {
          nivel: (n, total, nombre) => `Ts'íibil ${n} ti' ${total}: ${nombre}`,
          pregunta: (n, total) => `K'áatchi' ${n} ti' ${total}.`,
          contador: (n, total, puntos) => `K'áatchi' ${n} ti' ${total}. Ma'alob: ${puntos}.`,
          cierto_o_falso: "¿Ja'aj wa ma' ja'ajil? Yéey junp'éel.",
          acierto: "¡Ma'alob!",
          retroBien: (v) => `¡Ma'alob! ${v}.`,
          retroMal: (marcada, v) => `Ta yéeyaj «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          respuesta: (v) => `U núukil: ${v}`,
          graficaMuestra: "Le gráfica ku ye'esik:",
          siguiente: "Uláak' k'áatchi'",
          verResultado: "Il ba'ax ta beetaj",
        },
        resultado: {
          titulo: (puntos, total) => `Ma'alob ta núukaj ${puntos} ti' ${total}`,
          paso2: "100 máak je'ex teech",
          paso2Pais: "Bix tu yéeyaj México",
          paso3: "A kuxtal je'ex yéeyaj máak",
          paso3Estimaciones: "Ba'ax ta tukultaj",
          pasoContador: (n, total) => `${n} ti' ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Tuláakal ma'alob!";
            if (puntos >= total - 2) return `¡Ma'alob! A wojel bix u yéey ${lugar}.`;
            if (puntos >= total / 2) return "Ma'alob a bin. Wa jaytúul mitos tu tusikech.";
            return "Le mitoso'ob tu náajaltajo'ob, ba'ale' bejla'e' a wojel le datos.";
          },
          resumen: (enunciado, v, acerto) => `${enunciado} U núukil: ${v}. ${acerto ? "Ma'alob." : "Ma' ma'alobi'."}`,
        },
        graficas: {
          sinDato: "mina'an dato", grupo: "Múuch'", participacion: "Yéeyaj", anio: "Ja'ab", tipo: "Bix",
          deCada100: "Ti' 100", votaron: "Tu yéeyo'ob", noVotaron: "Ma' tu yéeyo'obi'",
          unidades: (titulo, quien, si, no) => `${titulo}. Ti' 100 ${quien}, ${si} tu yéeyo'ob yéetel ${no} ma'.`,
          leyendaSi: (n) => `Tu yéeyo'ob: ${n}`,
          leyendaNo: (n) => `Ma' tu yéeyo'obi': ${n}`,
          resumenSerie: (d, x0, h, x1, min, xMin, max, xMax) => `${d} tu ja'abil ${x0}, ${h} tu ja'abil ${x1}; u asab chan ${min} tu ja'abil ${xMin}, u asab ya'ab ${max} tu ja'abil ${xMax}`,
        },
        portada: {
          titulo: (lugar) => `¿Máaxo'ob ku yéeyo'ob ich ${lugar}?`,
          juego: (n) => `Il wa ja'aj le ba'ax a tukultik: ${n} t'aan, ¿ja'aj wa ma'?`,
          edicion: (lugar) => `Edición ${lugar}: chéen le t'aano'ob ja'ajo'ob ich le estadoa'.`,
          sinEdicion: "Ma' yaan to utia'al le estadoa'; táan a báaxal yéetel tuláakal México.",
        },
        compromiso: {
          opciones: {
            credencial: "In wilik ma'alob in credencial",
            votar: (anio) => `In yéey tu ja'abil ${anio}`,
            invitar: "In t'aanik juntúul máak ti' uláak' generación ka u báaxt",
          },
          elegido: (t) => `A t'aan: ${t}. Yaan ti' a tarjeta.`,
          tarjeta: "In t'aan:",
        },
        reto: {
          aviso: (p, t) => `Juntúul máak tu t'aanech: tu núukaj ${p} ti' ${t}. ¿Yaan wa a náajaltik?`,
          avisoEstado: (p, t, lugar) => `Juntúul máak tu t'aanech ich edición ${lugar}: tu núukaj ${p} ti' ${t}. ¿Yaan wa a náajaltik?`,
        },
        tarjeta: {
          sello: "¿MITO WA DATO?", miResultado: "Ba'ax tin beetaj", perfil: "Bix u yéey máaxo'ob je'ex teen:",
          meGanas: "¿Yaan wa a náajaltiken?", juegaEn: "Báaxal ich:", qr: "wa il le código",
          descripcion: (p, t, perfil) => `Tarjeta: ${p} ti' ${t} ma'alob. ${perfil} ¿Yaan wa a náajaltiken? Yaan junp'éel código QR.`,
        },
        salon: { votar: "Líik'sik a k'abo'ob: ¿ja'aj wa ma' ja'ajil?", paraConversar: "Ko'ox tsikbal:", terminar: "Ts'o'ok" },
        perfilPantalla: {
          estadosVisibles: (n) => `${n} estados ich le lista.`,
          ninguno: "Mina'an junp'éel estado bey.",
          errorEdad: (min, max) => `Ts'íibt junp'éel ja'ab ${min} tak ${max}, wa p'áat.`,
          errorVacio: "Ts'íibt a ja'abil wa yéey a estado. Wa ma' a k'áat a wa'alik, yéey «Ma' in k'áat in wa'alik».",
        },
        municipio: {
          visibles: (n) => `${n} municipios ich le lista.`,
          ninguno: "Mina'an junp'éel municipio bey.",
          final: (nombre, v, anio) => `Ich a municipio, ${nombre}, tu yéeyo'ob ${v} ti' 100 tu ja'abil ${anio}.`,
        },
        historia: {
          titulo: (edad, lugar) => (edad != null ? `Yaan ${edad} a ja'abil${lugar ? ` yéetel kajakbalech ich ${lugar}` : ""}.` : `Kajakbalech ich ${lugar}.`),
          menor: (anio, esProxima, fecha) => `Ma' tu páajtal a yéey to. A yáax yéeyaj ${esProxima ? `tu ${fecha}` : anio}.`,
          sinElecciones: (fecha) => `Ma' k'uchuk to a yéeyaj: a yáax yéeyaj tu ${fecha}.`,
          todas: (n, desde, hasta) => `Ichil le ${n} yéeyajo'ob (${desde} tak ${hasta}) páajtal a yéey ichil tuláakal.`,
          algunas: (primera, n, total) => `A yáax yéeyaj tu ja'abil ${primera}. Tu k'uchtech ${n} ti' le ${total} yéeyajo'ob.`,
          lugar: (l) => `Ichil kada k'áatchi' yaan a wilik bix u yéey máaxo'ob je'ex teech ich ${l}.`,
          soloLugar: (l) => `Ichil kada k'áatchi' yaan a wilik bix u yéey máak ich ${l}.`,
        },
        estimar: {
          pregunta: (q, l, a) => `Ma'ili' a núukik, tukult: ¿jaytúul ti' 100 ${q} ich ${l} tu yéeyo'ob tu ja'abil ${a}?`,
          preguntaGrupo: (q, l, a) => `K'áat ti' le múuch'o': ¿jaytúul ti' 100 ${q} ich ${l} tu yéeyo'ob tu ja'abil ${a}?`,
          de18: "máaxo'ob yaan 18 u ja'abil",
          deTuEdad: (e) => `máaxo'ob yaan ${e} u ja'abil (je'ex teech)`,
          de18a29: "máaxo'ob yaan 18 tak 29 u ja'abil",
          de60a69: "máaxo'ob yaan 60 tak 69 u ja'abil",
          unidad: "ti' 100",
          valorTexto: (v) => `${v} ti' 100`,
          resultado: (p, r) => (p === r ? `Ta tukultaj ${p} yéetel ja'aj ${r}.` : `Ta tukultaj ${p}; u ja'ajile' ${r}.`),
          diferencia: (p, r) => {
            const d = r - p;
            if (d === 0) return " ¡Ta chukaj!";
            if (Math.abs(d) <= 3) return " ¡Jach naats' ta chukaj!";
            return d > 0 ? ` Tu yéeyo'ob ${d} asab.` : ` Tu yéeyo'ob ${-d} ma' ya'ab.`;
          },
          resultadoGrupo: (r) => `U ja'ajile' ${r} ti' 100.`,
          ahora: "Bejla'e', ¿ja'aj wa ma' ja'ajil?",
          tuEstimacion: "Ba'ax ta tukultaj",
          datoReal: "U ja'ajil dato",
          tituloGrafica: (q, l, a) => `Ba'ax ta tukultaj yéetel u ja'ajil: ${q} ich ${l}, ${a}`,
          resumen: (p) => `Ba'ax ta tukultaj yaan bey ${p} puntos ti' u ja'ajil dato.`,
          item: (q, l, p, r) => `${q} ich ${l}: ta tukultaj ${p}, u ja'ajile' ${r}.`,
        },
        enTuCaso: {
          titulo: "¿Ka teech?",
          igual: (l) => `Ich ${l} je'el bixe':`,
          distinto: (l) => `Ich ${l} jela'an:`,
          empate: (l) => `Ich ${l} jach ke'etel:`,
          sexo: (m, h, a, pct) => `tu ja'abil ${a} tu yéeyo'ob ${pct(m)} ko'olelo'ob yéetel ${pct(h)} xiibo'ob.`,
          mujeres: "Ko'olelo'ob", hombres: "Xiibo'ob",
          tituloSexo: (l, a) => `Yéeyaj tumen ko'olelo'ob yéetel xiibo'ob ich ${l}, ${a}`,
          campoSinDatos: (l) => `Ich ${l} ma' ya'ab secciones ich kool utia'al u ke'eta'al.`,
          campo: (d, pct) => ({
            coincide: `ichil junp'éel yéeyaj, kool tu yéey je'el bix wa asab ti' nojoch kaaj. Tu ja'abil ${d.anio}: ${pct(d.rural)} ich kool yéetel ${pct(d.urbana)} ich nojoch kaaj.`,
            empate: `tu ja'abil ${d.anio} kool yéetel nojoch kaaj jach ke'etel: ${pct(d.rural)} yéetel ${pct(d.urbana)}.`,
            contrario: `kool ma' ya'ab tu yéey ti' nojoch kaaj ichil tuláakal le yéeyajo'ob. Tu ja'abil ${d.anio}: ${pct(d.rural)} ich kool yéetel ${pct(d.urbana)} ich nojoch kaaj.`,
          }[d.relacion]),
          rural: "Kool", urbana: "Nojoch kaaj",
          tituloCampo: (l, a) => `Yéeyaj ich kool yéetel nojoch kaaj ich ${l}, ${a}`,
          intermedias: (d, pct) => {
            const i = `${d.intermedia[0]}, ${pct(d.intermedia[1])}`;
            const p = `${d.presidencial[0]}, ${pct(d.presidencial[1])}`;
            return {
              coincide: `u intermedia asab yéeyaj (${i}) ma' tu k'uchul ti' u presidencial ma' ya'ab yéeyaj (${p}).`,
              empate: `u intermedia asab yéeyaj (${i}) jach naats' ti' u presidencial ma' ya'ab yéeyaj (${p}).`,
              contrario: `le intermedia ${d.intermedia[0]} (${pct(d.intermedia[1])}) asab ti' le presidencial ${d.presidencial[0]} (${pct(d.presidencial[1])}).`,
            }[d.relacion];
          },
          presidencial: "Presidencial", intermedia: "Intermedia",
          tituloElecciones: (l) => `Yéeyaj ich ${l}`,
          tendencia: (d, pct) => {
            const s = d.intermedias.map(([a, v]) => `${pct(v)} tu ja'abil ${a}`).join(", ");
            return {
              coincide: `u yéeyaj na'ak ichil kada intermedia: ${s}.`,
              empate: `jach ma' k'expaj: ${s}.`,
              contrario: `u yéeyaj éem ichil junp'éel intermedia: ${s}.`,
            }[d.relacion];
          },
          tituloIntermedias: (l) => `Yéeyaj ichil intermedias ich ${l}`,
          municipioIgual: (m) => `Ich ${m} je'el bix ich México:`,
          municipioDistinto: (m) => `Ich ${m} jela'an ti' México:`,
          municipioEmpate: (m) => `Ich ${m} jach ke'etel:`,
          municipioUmbral: (m, u) => `Ich ${m} ma' ya'ab máak ich le lista nominal (ma' tu k'uchul ${u.toLocaleString("es-MX")}); ma' tu páajtal junp'éel ma'alob dato.`,
          municipioFaltan: (m) => `${m} mina'an tuláakal le yéeyajo'ob; ma' tu páajtal u ke'eta'al.`,
          tituloEleccionesMunicipio: (m, e) => `Yéeyaj ich ${m} yéetel ${e}`,
          tituloIntermediasMunicipio: (m, e) => `Intermedias ich ${m} yéetel ${e}`,
          primerVoto: (d, v18, prom, l, pct) => ({
            coincide: `máaxo'ob yaan 18 u ja'abil tu yéeyo'ob ${pct(v18)}, asab ti' u promedio ${l} (${pct(prom)}).`,
            empate: `máaxo'ob yaan 18 u ja'abil tu yéeyo'ob ${pct(v18)}; u promedio ${l}: ${pct(prom)}.`,
            contrario: `máaxo'ob yaan 18 u ja'abil tu yéeyo'ob ${pct(v18)}, ma' ya'ab ti' u promedio ${l} (${pct(prom)}).`,
          }[d.relacion]),
          tuEdad: (e, l, v, q, a) => `Tu ja'abil ${a} yaan ${e} a ja'abil. Ich ${l}, ti' 100 ${q}, tu yéeyo'ob ${v}.`,
          cuandoCumplas: (l, v, a) => `Ken yanak 18 a ja'abil: ich ${l}, ti' 100 máaxo'ob yaan 18 u ja'abil, tu yéeyo'ob ${v} tu ja'abil ${a}.`,
          a18: (l) => `18 ja'ab ich ${l}`,
          aTuEdad: (q, l) => `${q} ich ${l}`,
          promedio: (l) => `U promedio ${l}`,
          tituloEdad: (l, a) => `Yéeyaj je'ex u ja'abil ich ${l}, ${a}`,
          jovenes: (d, j, a, pct) => `tu ja'abil ${a} tu yéeyo'ob ${pct(j)} máaxo'ob yaan 18 tak 29 u ja'abil.`,
          jovenesQuien: "máaxo'ob yaan 18 tak 29 u ja'abil",
          tituloUnidades: (q, l, a) => `100 ${q} ich ${l}: jaytúul tu yéeyo'ob tu ja'abil ${a}`,
          sesentas: (d, pct) => `máaxo'ob asab tu yéeyo'ob tu ja'abil ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}).`,
          mayores: (d, pct) => (d.relacion === "coincide"
            ? `máaxo'ob ma' ya'ab tu yéeyo'ob tu ja'abil ${d.anio}: 85 ja'ab wa asab (${pct(d.valor)}).`
            : `máaxo'ob ma' ya'ab tu yéeyo'ob tu ja'abil ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}); 85 ja'ab wa asab: ${pct(d.v85)}.`),
          tuGrupo: (g, v, l, a, pct) => `Tu ja'abil ${a} máaxo'ob je'ex teech, ${TEXTOS.perfil.grupoLegible(g)}, tu yéeyo'ob ${pct(v)} ich ${l}.`,
          tituloGrupos: (l, a) => `Yéeyaj je'ex u ja'abil ich ${l}, ${a}`,
        },
        historiaVotante: {
          titulo: "A kuxtal je'ex yéeyaj máak",
          intro: (l) => `Bix tu yéeyo'ob máaxo'ob je'ex teech ich ${l}, ichil kada yéeyaj.`,
          introMenor: (l) => `Bix tu yéeyo'ob máaxo'ob yaan 18 u ja'abil ich ${l}.`,
          introSinEdad: (l) => `Bix tu yéey ${l} ichil kada yéeyaj.`,
          tipo: (p) => (p ? "Presidencial" : "Intermedia"),
          tenias: (e) => `Yaan ${e} a ja'abil.`,
          hitoEdad: (e) => `${e} ja'ab`,
          hitoValor: (v) => `${v} ti' 100`,
          hitoGrupo: (g) => `(múuch' ${g})`,
          hitoPais: "(dato México)",
          valor: (v, q, l) => `Tu yéeyo'ob ${v} ti' 100 ${q} ich ${l}.`,
          valorTotal: (v, l) => `Tu yéeyo'ob ${v} ti' 100 ich ${l}.`,
          proxima: (f) => `A uláak' yéeyaj: ${f}.`,
          primera: (a, esP, f) => `A yáax yéeyaj: ${esP ? f : a}.`,
          porMarcar: "¿Yaan wa a chíikbesik lela'?",
          columnas: ["Yéeyaj", "Bix", "Ja'ab", "Ti' 100"],
          fuente: (d, h) => `Tu'ux u taal: INE, Conteos Censales de Participación Ciudadana, ${d}–${h}.`,
        },
        perfil: {
          titulo: "¿Bix u yéey máaxo'ob je'ex teech?",
          grupoLegible: (g) => (g.includes("más") ? `${parseInt(g, 10)} ja'ab wa asab` : `${g.replace("–", " tak ")} ja'ab`),
          edadLegible: (e) => (e >= 85 ? "85 ja'ab wa asab" : `${e} ja'ab`),
          personas: "máako'ob",
          tituloUnidades: (q, l, a) => `100 ${q} ich ${l}: jaytúul tu yéeyo'ob tu ja'abil ${a}`,
          quien: (r) => `máaxo'ob yaan ${r.nivel === "grupo" ? TEXTOS.perfil.grupoLegible(r.grupo) : TEXTOS.perfil.edadLegible(r.edad)}`,
          nota: (r, lugarPedido) => {
            if (r.nivel === "grupo") return ` Ich ${r.lugar} ma' ya'ab máaxo'ob yaan ${TEXTOS.perfil.edadLegible(r.edad)}; le beetik k meyajtik u múuch'il.`;
            if (r.nivel === "pais") return ` Ich ${lugarPedido} ma' ya'ab máak yaan le ja'abila'; le beetik k meyajtik u dato México.`;
            return "";
          },
          todoPais: "Tuláakal México",
          todo: (e) => `Tuláakal ${e}`,
          mensajeEdad: ({ edad, lugar, quien, valor, anio }) => `Tu ja'abil ${anio} yaan ${edad} a ja'abil. Ich ${lugar}, ti' 100 ${quien}, tu yéeyo'ob ${valor}.`,
          mensaje: ({ lugar, grupo, valor, anio, menor }) => {
            const b = grupo ? `Ich ${lugar}, ti' 100 máaxo'ob yaan ${grupo}, tu yéeyo'ob ${valor} tu ja'abil ${anio}.`
              : `Ich ${lugar} tu yéeyo'ob ${valor} ti' 100 tu ja'abil ${anio}.`;
            return menor ? `Ken yanak 18 a ja'abil: ${b}` : b;
          },
          comparaEstado: (e, ve, vp) => `U promedio ${e}: ${ve} ti' 100; México: ${vp} ti' 100.`,
          comparaPais: (vp) => `U promedio México: ${vp} ti' 100.`,
          contexto: "Bix tu yéey kada múuch' ich México.",
          graficaTitulo: (a) => `Yéeyaj tu ja'abil ${a}`,
          graficaGrupos: (a) => `Yéeyaj je'ex u ja'abil ich tuláakal México, ${a}`,
          etiquetaGrupoLugar: (g, l) => `${g} ich ${l}`,
          fuente: (a) => `Tu'ux u taal: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
        },
        mapa: {
          leyenda: (d, h) => (h == null ? `${d} wa asab` : d == null ? `ma' tu k'uchul ${h}` : `${d} tak ${h}`),
          tituloLeyenda: "Ti' 100 máak, tu yéeyo'ob:",
          sinDato: "Mina'an dato (ma' ya'ab máak)",
          deCada100: (v) => (v == null ? "mina'an dato" : `${Math.round(v)} ti' 100`),
        },
        explorar: {
          ver: { total: "Tuláakal máak", edad: "Je'ex u ja'abil", sexo: "Ko'olelo'ob yéetel xiibo'ob", seccion: "Kool yéetel nojoch kaaj" },
          grupos: {
            edad: { "18": "18 ja'ab (yáax yéeyaj)", "18–29": "18 tak 29 ja'ab", "30–44": "30 tak 44 ja'ab", "45–59": "45 tak 59 ja'ab", "60–69": "60 tak 69 ja'ab", "70–84": "70 tak 84 ja'ab", "85 y más": "85 ja'ab wa asab" },
            sexo: { Mujeres: "Ko'olelo'ob", Hombres: "Xiibo'ob" },
            seccion: { Urbana: "Nojoch kaaj", Mixta: "Secciones mixtas", Rural: "Kool" },
          },
          quien: {
            total: "máako'ob",
            edad: { "18": "máaxo'ob yaan 18 u ja'abil", "18–29": "máaxo'ob yaan 18 tak 29 u ja'abil", "30–44": "máaxo'ob yaan 30 tak 44 u ja'abil", "45–59": "máaxo'ob yaan 45 tak 59 u ja'abil", "60–69": "máaxo'ob yaan 60 tak 69 u ja'abil", "70–84": "máaxo'ob yaan 70 tak 84 u ja'abil", "85 y más": "máaxo'ob yaan 85 u ja'abil wa asab" },
            sexo: { Mujeres: "ko'olelo'ob", Hombres: "xiibo'ob" },
            seccion: { Urbana: "máako'ob ich nojoch kaaj", Mixta: "máako'ob ich secciones mixtas", Rural: "máako'ob ich kool" },
          },
          anio: (a, p) => `${a} (${p ? "presidencial" : "intermedia"})`,
          titulo: (q, a) => `Ti' 100 ${q}, jaytúul tu yéeyo'ob tu ja'abil ${a}`,
          estadoNombre: (n, v, d) => `${n}: ${TEXTOS.mapa.deCada100(v)}${v == null ? "" : d === 0 ? ", je'ex México" : `, ${Math.abs(d)} ${d > 0 ? "asab" : "ma' ya'ab"} ti' México`}`,
          frase: (l, v, q, a, n, ref) => {
            const d = Math.round(v) - Math.round(n);
            const c = d === 0 ? `Je'ex u promedio ${ref} (${Math.round(n)}).` : `${Math.abs(d)} ${d > 0 ? "asab" : "ma' ya'ab"} ti' u promedio ${ref} (${Math.round(n)}).`;
            return `Tu ja'abil ${a} tu yéeyo'ob ${Math.round(v)} ti' 100 ${q} ich ${l}. ${c}`;
          },
          lugar: (n, t) => `Yaan ti' u ${n} ti' ${t} estados.`,
          sinDato: (l) => `Ich ${l} ma' ya'ab máak ich le múuch'a'; ma' tu páajtal junp'éel ma'alob dato.`,
          soloTotal: "Utia'al municipio chéen yaan u dato tuláakal máak.",
          munSinDato: (m) => `${m} ma' ya'ab máak yaan ich le lista nominal, wa ma' yaan ka'achi; ma' tu páajtal junp'éel ma'alob dato.`,
          tituloSerie: (q, d, h) => `Ti' 100 ${q}, jaytúul tu yéeyo'ob ${d} tak ${h}`,
          pais: "México", delPais: "México", deLugar: (n) => n,
          colEstado: "Estado", colMunicipio: "Municipio", colValor: "Ti' 100", colDifCon: (r) => `Yéetel ${r}`,
          ordenar: (c) => `Tsol yéetel ${c.toLowerCase()}`,
          tablaEstados: "Il tuláakal le estados ich junp'éel tabla",
          tablaMunicipios: (e) => `Il le municipios ich ${e}`,
          fuente: (a) => `Tu'ux u taal: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
          copiado: "Ts'o'ok u copiarta'al le enlace.",
          copiaManual: (u) => `Copiart: ${u}`,
          miEstado: (n) => `Il in estado (${n})`,
          municipio: { visibles: (n) => `${n} municipios.`, ninguno: "Mina'an." },
        },
        atlas: {
          pct: (v) => (v == null ? "mina'an dato" : `${v.toFixed(1)}%`),
          puntos: (v) => `${Math.abs(v).toFixed(1)} puntos`,
          error: "Ma' páajchaj u na'akal le mapa.",
          escuchar: "U'uy",
          mapa: {
            tituloPais: "Yéeyaj je'ex estado",
            anio: (a, p) => `${a} · ${p ? "presidencial" : "intermedia"}`,
            desc: (t, a, lista) => `U mapail México. ${t}, ${a}. ${lista}`,
            listaEstados: (f) => `${f.map(([n, v]) => `${n}: ${v == null ? "mina'an dato" : `${v.toFixed(1)}%`}`).join("; ")}.`,
          },
          pasos: {
            regionesTitulo: "Wakp'éel regiones",
            regionesTexto: "Utia'al a xíimbaltik México, ts'o'ok k much'ik le estadoso'ob ich wakp'éel regiones.",
            regionEtiqueta: (n, t) => `Región ${n} ti' ${t}`,
            tablaEstados: "Il le estados ich junp'éel tabla",
            colEstado: "Estado",
            colVoto: (a) => `Tu yéeyo'ob tu ja'abil ${a}`,
          },
          compara: {
            frase: (e, a, d, l) => `Tu ja'abil ${a}, ${e} tu yéey ${Math.abs(d) < 0.05 ? "je'ex México" : `${TEXTOS.atlas.puntos(d)} ${d > 0 ? "asab" : "ma' ya'ab"} ti' México`}; yaan ti' u ${l} ti' 32 estados.`,
            votoEn: (e, a) => `tu yéeyo'ob ich ${e} tu ja'abil ${a}`,
            tituloHistoria: (d, h) => `Yéeyaj ${d}–${h}`,
            tituloEdad: (a) => `Je'ex u ja'abil, ${a}`,
            tituloSexo: (a) => `Ko'olelo'ob yéetel xiibo'ob, ${a}`,
            tituloSeccion: (a) => `Kool yéetel nojoch kaaj, ${a}`,
            fraseEdad: (e, g, d) => `Tu'ux asab jela'an ti' México: máaxo'ob yaan ${TEXTOS.perfil.grupoLegible(g)}; ich ${e} tu yéeyo'ob ${TEXTOS.atlas.puntos(d)} ${d > 0 ? "asab" : "ma' ya'ab"}.`,
            colGrupo: "Múuch'", colAnio: "Yéeyaj", nacional: "México", sinDato: "Mina'an dato",
          },
        },
        metodo: {
          umbral: (n) => `Ma' k ye'esik u dato junp'éel múuch' wa yaan ma' tu k'uchul ${n.toLocaleString("es-MX")} máak ich le lista nominal: ma' ma'alob le datoa'. Le ken úuchuk lela', yaan a wilik «mina'an dato».`,
          nota: "Yéeyaj = máaxo'ob tu yéeyo'ob ÷ (máaxo'ob tu yéeyo'ob + máaxo'ob ma' tu yéeyo'obi'), yéetel u lista nominal. Ma' táaka'an le casillas especiales mix u yéeyaj máak yaan tu láak' lu'umil.",
        },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Káajbal",
        '.nav-principal a[data-seccion="juego"] span': "Báaxal",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "¿Bix u xo'okol?",
        "#t-lectura": "Bix a xokik",
        "#portada-entrada": "U ts'íibil INE yóok'lal máax yéeyo'ob ichil 2009 tak 2024. Yéey bix a wilik.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Báaxal: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Bey 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Il le mapa",
        "#puerta-mapa-txt": "Il bix ku yéeyo'ob ich a estado yéetel ich a municipio.",
        "#puerta-mapa-tiempo": "Bey 3 minutos",
        '.enlaces-portada [data-ir="talleres"]': "¿Ka ka'ansaj? Modo salón yéetel ju'un →",
        "#t-talleres": "Utia'al ka'ansaj",
        "#talleres .entrada": "Utia'al u báaxal ya'ab máak yéetel junp'éel proyector, wa ich ju'un.",
        ".opcion-taller:nth-of-type(1) h3": "Modo salón",
        ".opcion-taller:nth-of-type(1) p": "Junp'éel k'áatchi' ich kada pantalla yéetel le múuch'o' ku yéey yéetel u k'ab.",
        "#entrar-salon": "Káajs modo salón",
        ".opcion-taller:nth-of-type(2) h3": "Utia'al u ts'íibta'al",
        ".opcion-taller:nth-of-type(2) p": "Tarjetas yéetel le t'aan yéetel u núukil.",
        ".opcion-taller:nth-of-type(2) a": "Je'ik utia'al u ts'íibta'al",
        ".opcion-taller:nth-of-type(3) h3": "Guía",
        ".opcion-taller:nth-of-type(3) p": "Junp'éel ka'ansaj ti' 20 minutos (ich español).",
        ".opcion-taller:nth-of-type(3) a": "Xok le guía",
        '#talleres [data-ir="portada"]': "Suunaj",
        "#t-instr": "Bix u báaxta'al",
        ".pasos li:nth-child(1) > span:last-child": "Xok le t'aano'. Wa jayp'éel mitos, wa jayp'éel ja'aj.",
        ".pasos li:nth-child(2) > span:last-child": "Yéey: Ja'aj wa Ma' ja'ajil.",
        ".pasos li:nth-child(3) > span:last-child": "Il le datos. Junp'éel séeyo yéetel junp'éel gráfica ku ye'esik ba'ax ja'aj.",
        ".nota-papel p": "¿Ba'ax yéeyaj? Jaytúul máak ti' 100 bino'ob yéey. Wa ku ya'alik 60%, tu yéeyo'ob 60 ti' 100.",
        '#instrucciones [data-ir="perfil"]': "Ko'ox káajsik",
        "#t-perfil-pantalla": "Ma'ili' k káajsik: ¿máax ech ich le tsikbala'?",
        "#perfil .entrada": "Yéetel a ja'abil yéetel a estado, yaan a wilik bix u yéey máaxo'ob je'ex teech.",
        'label[for="p-edad"]': "Jayp'éel a ja'abil",
        "#edad-ayuda": "15 tak 100 ja'ab.",
        'label[for="p-estado"]': "A estado",
        ".privacidad span": "Ma' k ts'áaik mix k túuxtik a núukilo'ob.",
        "#perfil-continuar": "Bin táanil",
        "#perfil-no-decir": "Ma' in k'áat in wa'alik",
        "#momento .folio": "A tsikbalil",
        "#iniciar": "Ko'ox káajsik",
        '#momento [data-ir="perfil"]': "K'ex in datos",
        '.opcion[data-respuesta="cierto"] span:last-child': "Ja'aj",
        '.opcion[data-respuesta="falso"] span:last-child': "Ma' ja'ajil",
        "#est-ver": "Il le dato",
        "#ver-en-mapa": "Il lela' ichil le mapa →",
        ".mas-contexto > summary": "Uláak' ba'alo'ob",
        "#discusion strong": "Ko'ox tsikbal:",
        ".g-tabla > summary": "Il le datos ich junp'éel tabla",
        "#paso-siguiente": "Uláak'",
        "#paso-atras": "Suunaj",
        "#paso-1 .plegable summary": "A núukilo'ob",
        ".invita-mapa button": "¿Ka ich a estado? Il ichil le mapa →",
        "#estimaciones summary": "Il kada junp'éel",
        "#t-paso-4": "A t'aan yéetel a tarjeta",
        "#t-compromiso": "Yéey junp'éel t'aan:",
        "#compartir": "Ts'a a tarjeta",
        "#descargar": "Éensik",
        "#reto-generacion": "T'aan juntúul máak ti' uláak' generación",
        "#copiar": "Copiart le enlace",
        "#paso-4 .enlaces-portada a": "INE",
        '#paso-4 [data-ir="mapa"]': "Il le mapa",
        ".jugar-otra": "Ka' báaxal",
        ".llamado li:nth-child(1)": "Kaxt ich fuentes oficiales ma'ili' a túuxtik junp'éel xookil.",
        ".llamado li:nth-child(2)": "Il ma'alob a credencial utia'al a yéey.",
        ".llamado li:nth-child(3)": "Yéey ichil kada yéeyaj.",
        "#cierre .boton.primario": "INE",
        '#cierre [data-ir="mapa"]': "Il le mapa",
        "#cierre .enlace-imprimible": "Utia'al u ts'íibta'al",
        "#t-mapa": "Il a lu'umil",
        "#mapa > .entrada": "Il bix yéeyo'ob ich kada estado yéetel municipio, 2009 tak 2024.",
        "#volver-juego": "← Suunaj ti' le báaxal",
        "#tab-explorar": "Il",
        "#tab-recorrido": "Xíimbal tu regionesil",
        ".mx-campo:nth-child(1) .campo-titulo": "Yéeyaj",
        ".mx-campo:nth-child(2) .campo-titulo": "Ba'ax a wilik",
        ".mx-campo:nth-child(3) .campo-titulo": "Múuch'",
        "#mx-ayuda": "Yéey junp'éel estado ich le mapa, wa yéetel u teclado (flechas yéetel Enter), wa ich le lista.",
        "#mx-leyenda-t": "Ti' 100 máak, tu yéeyo'ob:",
        "#mx-pais": "Il tuláakal México",
        'label[for="mx-estado"]': "Estado",
        '#mx-estado option[value=""]': "Yéey junp'éel estado",
        "#mx-mi-edad": "Il máaxo'ob je'ex teen",
        'label[for="mx-municipio"]': "Kaxt junp'éel municipio",
        "#mx-indicacion": "Yéey junp'éel estado ich le mapa wa ich le lista.",
        "#mx-ponte": "¿A wojel a estado? Il →",
        "#mx-mas": "Il je'ex u ja'abil, ko'olelo'ob yéetel xiibo'ob →",
        "#mx-copiar": "Copiart le enlace",
        "#panel-recorrido > .entrada": "¿Tu'ux asab ku yéeyo'ob ich México? Éem chan chan: le mapa ku bin ich kada región yéetel ich a estado.",
        "#panel-recorrido > p > [data-a-compara]": "Il a estado bejla'e'",
        "#a-t-portada": "Yéeyaj ich México",
        ".at-paso-portada .at-texto": "Junp'éel xíimbal ich le mapa: tuláakal México, kada región yéetel a estado.",
        "#a-t-final": "¿Ka a estado?",
        ".at-paso-final > p:not([id])": "Yéey a estado utia'al a wilik bix u yéey. Ma' k ts'áaik ba'ax ka yéeyik.",
        'label[for="a-elige-estado"]': "A estado",
        '#a-elige-estado option[value=""]': "Yéey junp'éel estado",
        '#a-elige-estado-2 option[value=""]': "Yéey junp'éel estado",
        "#a-ir-compara": "Ke'et yéetel México →",
        "#a-t-compara": "A estado yéetel México",
        "#a-compara-vacio": "Yéey a estado:",
        'label[for="a-elige-estado-2"]': "Estado",
        ".at-compara-controles span.at-campo-titulo": "Yéeyaj",
        "#t-metodo": "¿Bix u xo'okol?",
        "#metodo > .entrada": "Tuláakal le xookilo'ob ku taal ti' junp'éel fuente yéetel ku xo'okol tu beel.",
        "#metodo h3:nth-of-type(1)": "Yéeyaj",
        "#metodo p:nth-of-type(3)": "K a'alik «ti' 100»: wa tu yéeyo'ob 60%, tu yéeyo'ob 60 ti' 100 máak.",
        "#metodo h3:nth-of-type(2)": "Tu'ux u taal",
        "#metodo p:nth-of-type(4)": "INE, Conteos Censales de Participación Ciudadana, 2009 tak 2024. Datos abiertos; mina'an u datos mix juntúul máak.",
        "#metodo h3:nth-of-type(3)": "Ma' ya'ab máak",
        "#metodo h3:nth-of-type(4)": "Lenguas indígenas",
        "#metodo h3:nth-of-type(5)": "Ba'ax ma' k ts'áaik",
        "#metodo p:nth-of-type(7)": "A ja'abil, a estado, a municipio yéetel a núukilo'ob chéen yaan ich le páginaa'. Ma' k ts'áaik, ma' k túuxtik.",
      },
      niveles: {
        "Así vota México": { nombre: "Bix u yéey México", intro: "Yáax: máax ku yéey yéetel ichil ba'ax elecciones." },
        "El primer voto": { nombre: "U yáax yéeyaj", intro: "Bejla'e', u chúumuk le tsikbala': ba'ax ku yúuchul ken k'uchuk a 18 ja'abil." },
        "Que el primer voto no sea el último": { nombre: "Ma' u ts'o'okol yéetel u yáax yéeyaj", intro: "¿Ka'aj ts'o'ok le yáax yéeyajo'? Ko'ox ilik ba'ax ku yúuchul yéetel le ja'abo'obo'." },
      },
      cierre: {
        titulo: "Ma' u ts'o'okol yéetel a yáax yéeyaj",
        texto: "Ken yanak {0} u ja'abil máak, asab ku yéey ti' u promedio México, ba'ale' ts'o'okole' ku éemel tak bey {1} ja'ab. Ma' u ts'o'okol yéetel a yáax yéeyaj.",
      },
      mitos: {
        sexo: {
          enunciado: "Xiibo'ob ku yéeyo'ob asab ti' ko'olelo'ob.",
          resumen: "Ko'olelo'obe' asab tu yéeyo'ob ti' xiibo'ob ichil le {0} yéeyajo'ob desde {1}. Chéen ken u yantal {2} u ja'abil, xiibo'obe' jump'íit asab tu yéeyo'ob.",
          explicacion: "Ko'olelo'obe' asab tu yéeyo'ob ti' xiibo'ob ichil le {0} yéeyajo'ob desde {1}. Tu ja'abil {2} tu yéeyo'ob {3} ko'olelo'ob yéetel {4} xiibo'ob. Chéen ken u yantal {5} u ja'abil, xiibo'obe' jump'íit asab tu yéeyo'ob.",
          dato: "ko'olelo'ob tu yéeyo'ob tu ja'abil {0}; xiibo'obe', {1}.",
          discusion: "¿Ba'axten ya'ab máak ku tukultik xiibo'ob asab ku yéeyo'ob? ¿Ba'ax ku beetik ko'olelo'ob asab u yéeyo'ob?",
          grafica: { titulo: "Yéeyaj tumen ko'olelo'ob yéetel xiibo'ob, {0}", nota: ["Tu ja'abil {0} yáax ts'íibta'ab le no binaria ({1}); ma' táaka'an way.", "Tu ja'abil {0} yáax ts'íibta'ab le no binaria; ma' táaka'an way."] },
        },
        campo: {
          enunciado: "Ich kool mantats' ma' ya'ab u yéeyo'ob je'ex ich nojoch kaaj.",
          resumen: "Ichil le {0} yéeyajo'ob, ich kool tu yéeyo'ob je'el bix wa asab ti' ich nojoch kaaj. Tu ja'abil {1} jach ke'etel: {2} yéetel {3}.",
          explicacion: "Desde {0}, ichil tuláakal le yéeyajo'ob, ich kool tu yéeyo'ob je'el bix wa asab ti' ich nojoch kaaj. Tu ja'abil {1}, tu yéeyo'ob {2} ich kool yéetel {3} ich nojoch kaaj. Tu ja'abil {4} jach ke'etel: {5} yéetel {6}.",
          dato: "tu yéeyo'ob ich kool tu ja'abil {0}; ich nojoch kaaje', {1}.",
          discusion: "¿Ba'ax ku yáantik wa ku talamkúuntik u bin máak yéey ich junp'éel kaaj ich kool? ¿Ka ich junp'éel nojoch kaaj?",
          grafica: { titulo: "Yéeyaj ich kool yéetel ich nojoch kaaj, {0}", nota: "INE ku ya'alik ba'ax kool yéetel ba'ax nojoch kaaj. Ma' tu ye'esa'al le secciones mixtas." },
        },
        intermedias: {
          enunciado: "Ichil le elecciones intermedias ma' ya'ab máak ku yéey je'ex ichil le presidenciales.",
          resumen: "Ichil le {0} intermedias ma' ya'ab máak tu yéey je'ex ichil le presidenciales. Ichil le intermedias ku yéeya'al diputados, ma' presidente.",
          explicacion: "Ichil le {0} intermedias ma' ya'ab máak tu yéey je'ex ichil le {1} presidenciales: le intermedia asab yéeyaj ({2}, {3}) ma' tu k'uchul ti' le presidencial ma' ya'ab yéeyaj ({4}, {5}). Ichil le intermedias ku yéeya'al diputados, ma' presidente.",
          dato: "tu yéeyo'ob ichil le intermedia asab ({0}). Le presidencial ma' ya'ab yéeyaj yaan {1} ({2}).",
          discusion: "¿A wojelo'ob ba'ax ku yéeya'al ichil junp'éel elección intermedia? ¿Ba'axten ma' ya'ab u tukulta'al?",
          grafica: { titulo: "Yéeyaj ichil tuláakal México, {0}" },
        },
        "primer-voto": {
          enunciado: "Le máaxo'ob yaan 18 u ja'abil ma' ya'ab u yéeyo'ob je'ex u promedio tuláakal México.",
          resumen: "Ken yanak {0} u ja'abil máak, asab ku yéey ti' u promedio México, ichil le {1} yéeyajo'ob. Ts'o'okole' ku éemel tak {2} ken yanak {3} u ja'abil.",
          explicacion: "Ken yanak {0} u ja'abil máak, asab ku yéey ti' u promedio México, ichil le {1} yéeyajo'ob desde {2}. Tu ja'abil {3} tu yéeyo'ob {4} le máaxo'ob yaan {5} u ja'abilo'; u promedio México: {6}. Ts'o'okole' ku éemel: ku k'uchul {7} ken yanak {8} u ja'abil, ka ku ka' na'akal.",
          dato: "tu yéeyo'ob le máaxo'ob yaan {0} u ja'abil tu ja'abil {1}. U promedio México: {2}.",
          discusion: "¿Ba'ax ka k'a'ajsik wa ka tukultik yóok'lal a yáax yéeyaj? ¿Ba'axten ken yanak {0} u ja'abil máak asab ku yéey?",
          grafica: { titulo: "Yéeyaj je'ex u ja'abil, {0} tak {1} ja'ab, {2}" },
        },
        jovenes: {
          enunciado: "Táankelem máako'ob ma' tu yéeyo'ob.",
          resumen: "Leti'ob {0} máak. Ma' ya'ab u yéeyo'ob je'ex le máaxo'ob yaan {1} u ja'abil wa asab ({2}), ba'ale' ku yéeyo'ob.",
          explicacion: "Tu ja'abil {0} tu yéeyo'ob {1} le máaxo'ob yaan {2} tak {3} u ja'abilo': {4} máak. Desde {5} mix juntéen tu yéeyo'ob ma' ya'ab ti' jun xéet' ti' óoxp'éel (u asab chan: {6} tu ja'abil {7}). Ma' ya'ab u yéeyo'ob je'ex le máaxo'ob yaan {8} u ja'abil wa asab ({9} tu ja'abil {10}).",
          dato: "le máaxo'ob yaan {0} tak {1} u ja'abil tu yéeyo'ob tu ja'abil {2}.",
          discusion: "¿Ba'ax ku beetik junp'éel táankelem máak ma' u ka' yéey ken ts'o'okok u yáax yéeyaj? ¿Ba'ax je'el u yáantik ka u láayli' yéey?",
          grafica: { titulo: "Yéeyaj je'ex u ja'abil, {0}" },
        },
        sesentas: {
          enunciado: "Le máaxo'ob yaan 60 tak 69 u ja'abil, leti'ob asab ku yéeyo'ob.",
          resumen: "Ichil le {0} yéeyajo'ob, le máaxo'ob asab tu yéeyo'ob yaan {1} tak {2} u ja'abil. U promedio México: {3}.",
          explicacion: "Ichil le {0} yéeyajo'ob desde {1}, le máaxo'ob asab tu yéeyo'ob yaan {2} tak {3} u ja'abil. Tu ja'abil {4} leti'e' le máaxo'ob yaan {5} u ja'abilo', yéetel {6}, asab ti' u promedio México ({7}).",
          dato: "tu yéeyo'ob le máaxo'ob yaan {0} u ja'abil tu ja'abil {1}.",
          discusion: "¿Ba'ax suukil ku beetik junp'éel máak u yéey tu tuláakal u kuxtal?",
          grafica: { titulo: "Le máaxo'ob asab tu yéeyo'ob ichil kada yéeyaj" },
        },
        mayores: {
          enunciado: "Le máaxo'ob yaan 85 wa asab u ja'abil, leti'ob ma' ya'ab ku yéeyo'ob.",
          resumen: "Leti'ob ma' ya'ab tu yéeyo'ob ichil le {0} yéeyajo'ob. Ma' ya'abo'obi': {1} ti' le lista nominal.",
          explicacion: "Ichil le {0} yéeyajo'ob desde {1}, le máaxo'ob yaan {2} u ja'abil wa asab ma' ya'ab tu yéeyo'ob. Tu ja'abil {3} tu yéeyo'ob {4}; le máaxo'ob yaan {6} u ja'abilo', {5}. Ma' ya'abo'obi': {7} ti' le lista nominal.",
          dato: "tu yéeyo'ob le máaxo'ob yaan {0} u ja'abil wa asab tu ja'abil {1}.",
          discusion: "¿Ba'ax talamil yaan ti' junp'éel máak yaan {0} u ja'abil wa asab utia'al u bin yéey? ¿Bix je'el u yáanta'al?",
          grafica: { titulo: "Yéeyaj je'ex u ja'abil, {0}" },
        },
        tendencia: {
          enunciado: "Ichil le elecciones intermedias, u yéeyaj máak táan u éemel desde 2009.",
          resumen: "Kada intermedia yaan asab yéeyaj ti' le ts'o'ok máaniko'. Utia'al ma'alob u ke'eta'al, il yéeyajo'ob je'el bix u beelil.",
          explicacion: "Kada elección intermedia yaan asab yéeyaj ti' le ts'o'ok máaniko'. Tu yéeyo'ob {0} tu ja'abil {1}, {2} tu ja'abil {3} yéetel {4} tu ja'abil {5}. Utia'al ma'alob u ke'eta'al, il yéeyajo'ob je'el bix u beelil, tumen ichil le presidenciales mantats' asab máak ku yéey.",
          dato: "tu yéeyo'ob ichil le intermedia {0}; tu ja'abil {2}, {1}.",
          discusion: "Wa u yéeyaj ichil le intermedias je'el u na'akale', ¿ba'ax je'el a beetiko'ob utia'al ka u láayli' na'akal?",
          grafica: { titulo: "Yéeyaj ichil le elecciones intermedias" },
        },
      },
      atlas: {
        pais: { titulo: "México, {0}", texto: "Tu ja'abil {0} tu yéeyo'ob {1} le máaxo'ob yaan ich le lista nominal. Ba'ale' le promedioa' ku ta'akik junp'éel México jela'an ti' kada tu'ux." },
        extremos: { titulo: "Ma' tuláakal México ku yéey je'el bixe'", texto: "Tu ja'abil {0}, {e0} asab tu yéey ({1}) yéetel {e1} ma' ya'ab ({2}): {3} puntos." },
        intermedia: { titulo: "Wa mina'an presidencial, ma' ya'ab u yéeyaj", texto: "Tu ja'abil {0}, mina'an presidencial, tu yéeyo'ob {1}: {2} puntos ma' ya'ab ti' tu ja'abil {3}. Éem ich {4} ti' {5} estados." },
        noroeste: { titulo: "Le región ma' ya'ab ku yéeyo'ob", texto: "Ichil {0} ti' {1} yéeyajo'ob desde {2}, Noroeste ma' ya'ab tu yéeyo'ob. Tu ja'abil {3} tu yéeyo'ob {4}, {5} puntos ma' ya'ab ti' México.", extra: "U táankelem máako'ob ({0} tak {1} ja'ab) ma' ya'ab ku yéeyo'ob ichil le wakp'éel regiones: {2} tu ja'abil {3}." },
        norte: { titulo: "Ma' je'el bixe'", texto: "Tu ja'abil {0}, {e0} tu yéey {1} yéetel {e1} {2}: {3} puntos ich junp'éel región.", extra: "{e0} yaan ti' u {0} ti' {1} yéetel {e1} ti' u {2}." },
        occidente: { titulo: "Táankelem yéetel nukuch máak, asab naats'", texto: "Way táankelem yéetel nukuch máak ku yéeyo'ob asab je'el bixe': tu ja'abil {0}, {1} le máaxo'ob yaan {2} tak {3} u ja'abil yéetel {4} le máaxo'ob yaan {5} u ja'abil wa asab; {6} puntos.", extra: "Ich tuláakal México, {0} puntos." },
        centro: { titulo: "Le región asab ku yéeyo'ob", texto: "Centro asab tu yéey tu ja'abil {0}: {1}, {2} puntos asab ti' México.", extra: "Way yaan {e0}, chéen le estadoa' asab tu yéey ichil le intermedia {0} ({1}) ti' le presidencial {2} ({3})." },
        sur: { titulo: "Kool asab ku yéey", texto: "Ich Sur, kool asab ku yéey ti' nojoch kaaj: {0} yéetel {1} tu ja'abil {2}.", extra: "Tu ja'abil {0} ma' ya'ab tu yéeyo'ob ({1}); tu ja'abil {2} tu yéeyo'ob {3}." },
        golfo: { titulo: "{e0} táanil", texto: "{e0} asab tu yéey ichil {0} ti' {1} yéeyajo'ob desde {2}; tu ja'abil {3} tu yéey {4}.", extra: "Tuláakal le región tu yéey {0} tu ja'abil {1}, asab ti' México." },
      },
    },

    // ------------------------------------------------------------------ tseltal
    tzh: {
      lang: "tzh",
      metodoAtlas: "Tsa'el = mach'atik la stsa'ik ÷ (la stsa'ik + ma' la stsa'ik) ta lista nominal. Ma' och te casillas especiales sok te tsa'el ta yan lum. Te regiones la spasik te at'eletik. Ma' ya jak' ta ilel te tsobol ma' sts'akaj {0},{1} ants winik ta lista nominal.",
      nombre: "tseltal",
      propio: "Bats'il k'op",
      variante: "forma general; sin variante regional verificada",
      etiquetas: [
        [/^Mujeres$/, "Antsetik"], [/^Hombres$/, "Winiketik"], [/^Rural$/, "K'altik"], [/^Urbana$/, "Muk'ul lum"],
        [/^Participación$/, "Tsa'el"], [/^Edad$/, "Sjabilal"], [/^(\d+) a (\d+) años$/, "$1 k'alal $2 ja'wil"],
        [/^Promedio nacional$/, "Promedio ta México"], [/^Promedio de (.+)$/, "Promedio ta $1"], [/ años o más/, " ja'wil o mas"], [/ y más años/, " ja'wil o mas"], [/ años/, " ja'wil"],
      ],
      fuente: "Banti lok'em:",
      textos: {
        veredictos: { cierto: "Melel", falso: "Ma' melel" },
        juego: {
          nivel: (n, total, nombre) => `Sts'ibal ${n} ta ${total}: ${nombre}`,
          pregunta: (n, total) => `Sjojk'obil ${n} ta ${total}.`,
          contador: (n, total, puntos) => `Sjojk'obil ${n} ta ${total}. Lek: ${puntos}.`,
          cierto_o_falso: "¿Melel me ma' melel? Tsa' jun.",
          acierto: "¡Lek!",
          retroBien: (v) => `¡Lek! ${v}.`,
          retroMal: (marcada, v) => `La atsa' «${marcada}». ${v}.`,
          retroSalon: (v) => `${v}.`,
          respuesta: (v) => `Sjak'ojibal: ${v}`,
          graficaMuestra: "Te gráfica ya yak' ta ilel:",
          siguiente: "Yan jojk'obil",
          verResultado: "Ila' bin la apas",
        },
        resultado: {
          titulo: (puntos, total) => `Lek la apas ${puntos} ta ${total}`,
          paso2: "100 ants winik jich bit'il ate",
          paso2Pais: "Bit'il la stsa' te México",
          paso3: "Akuxlejal bit'il ya atsa'",
          paso3Estimaciones: "Bin la anop",
          pasoContador: (n, total) => `${n} ta ${total}`,
          mensaje: (puntos, total, lugar) => {
            if (puntos === total) return "¡Spisil lek!";
            if (puntos >= total - 2) return `¡Lek! Ya ana' bit'il ya stsa' te ${lugar}.`;
            if (puntos >= total / 2) return "Lek ya xbajat. Jayeb mitos la slo'layat.";
            return "La sts'ikat te mitos, pero ya'yel ya ana' te datos.";
          },
          resumen: (enunciado, v, acerto) => `${enunciado} Sjak'ojibal: ${v}. ${acerto ? "Lek." : "Ma' lekuk."}`,
        },
        graficas: {
          sinDato: "ma'yuk dato", grupo: "Tsobol", participacion: "Tsa'el", anio: "Ja'wil", tipo: "Bit'il",
          deCada100: "Ta 100", votaron: "La stsa'ik", noVotaron: "Ma' la stsa'ik",
          unidades: (titulo, quien, si, no) => `${titulo}. Ta 100 ${quien}, ${si} la stsa'ik sok ${no} ma'.`,
          leyendaSi: (n) => `La stsa'ik: ${n}`,
          leyendaNo: (n) => `Ma' la stsa'ik: ${n}`,
          resumenSerie: (d, x0, h, x1, min, xMin, max, xMax) => `${d} ta ${x0}, ${h} ta ${x1}; mas juteb ${min} ta ${xMin}, mas bayel ${max} ta ${xMax}`,
        },
        portada: {
          titulo: (lugar) => `¿Mach'atik ya stsa'ik ta ${lugar}?`,
          juego: (n) => `Ila' me melel te bin ya ach'unbe: ${n} k'op, ¿melel me ma' melel?`,
          edicion: (lugar) => `Edición ${lugar}: ja' nax te k'op melel ta estado ini.`,
          sinEdicion: "Ma'to ay yu'un te estado ini; yakal ya atajin sok spisil México.",
        },
        compromiso: {
          opciones: {
            credencial: "Ya jk'el me lek te jcredencial",
            votar: (anio) => `Ya jtsa' ta ${anio}`,
            invitar: "Ya jk'opon jun ants winik yan generación yu'un ya stajin",
          },
          elegido: (t) => `Ak'op: ${t}. Ay ta atarjeta.`,
          tarjeta: "Jk'op:",
        },
        reto: {
          aviso: (p, t) => `Jun ants winik la sk'oponat: la sta ${p} ta ${t}. ¿Ya ats'ik?`,
          avisoEstado: (p, t, lugar) => `Jun ants winik la sk'oponat ta edición ${lugar}: la sta ${p} ta ${t}. ¿Ya ats'ik?`,
        },
        tarjeta: {
          sello: "¿MITO ME DATO?", miResultado: "Bin la jpas", perfil: "Bit'il ya stsa'ik te mach'atik jich bit'il jo'on:",
          meGanas: "¿Ya ats'ikon?", juegaEn: "Tajinan ta:", qr: "o k'elo te código",
          descripcion: (p, t, perfil) => `Tarjeta: ${p} ta ${t} lek. ${perfil} ¿Ya ats'ikon? Ay jun código QR.`,
        },
        salon: { votar: "Toyik ak'abik: ¿melel me ma' melel?", paraConversar: "Ya jk'opontik:", terminar: "Laj" },
        perfilPantalla: {
          estadosVisibles: (n) => `${n} estados ta lista.`,
          ninguno: "Ma'yuk jun estado jich.",
          errorEdad: (min, max) => `Ts'ibuya' jun sjabilal ${min} k'alal ${max}, me ijk'ita.`,
          errorVacio: "Ts'ibuya' asjabilal me tsa' awestado. Teme ma' ya ak'an ya awal, tsa' «Ma' ya jk'an ya jkal».",
        },
        municipio: {
          visibles: (n) => `${n} municipios ta lista.`,
          ninguno: "Ma'yuk jun municipio jich.",
          final: (nombre, v, anio) => `Ta amunicipio, ${nombre}, la stsa'ik ${v} ta 100 ta ${anio}.`,
        },
        historia: {
          titulo: (edad, lugar) => (edad != null ? `Ay ${edad} asjabilal${lugar ? ` sok nakalat ta ${lugar}` : ""}.` : `Nakalat ta ${lugar}.`),
          menor: (anio, esProxima, fecha) => `Ma'to xju' ya atsa'. Te sba atsa'el ${esProxima ? `ta ${fecha}` : anio}.`,
          sinElecciones: (fecha) => `Ma'to la ata jun tsa'el: te sba atsa'el ta ${fecha}.`,
          todas: (n, desde, hasta) => `Ta spisil te ${n} tsa'el (${desde} k'alal ${hasta}) ya xju' la atsa'.`,
          algunas: (primera, n, total) => `Sba atsa'el ta ${primera}. La ata ${n} ta ${total} tsa'el.`,
          lugar: (l) => `Ta jujun jojk'obil ya awil bit'il ya stsa'ik te mach'atik jich bit'il ate ta ${l}.`,
          soloLugar: (l) => `Ta jujun jojk'obil ya awil bit'il ya stsa'ik ta ${l}.`,
        },
        estimar: {
          pregunta: (q, l, a) => `Ba'yel, nopo: ¿jayeb ta 100 ${q} ta ${l} la stsa'ik ta ${a}?`,
          preguntaGrupo: (q, l, a) => `Jojk'obin te tsobole: ¿jayeb ta 100 ${q} ta ${l} la stsa'ik ta ${a}?`,
          de18: "mach'atik ay 18 sjabilal",
          deTuEdad: (e) => `mach'atik ay ${e} sjabilal (jich bit'il ate)`,
          de18a29: "mach'atik ay 18 k'alal 29 sjabilal",
          de60a69: "mach'atik ay 60 k'alal 69 sjabilal",
          unidad: "ta 100",
          valorTexto: (v) => `${v} ta 100`,
          resultado: (p, r) => (p === r ? `La anop ${p} sok melel ${r}.` : `La anop ${p}; te melele ${r}.`),
          diferencia: (p, r) => {
            const d = r - p;
            if (d === 0) return " ¡La ata!";
            if (Math.abs(d) <= 3) return " ¡Nopol la ata!";
            return d > 0 ? ` La stsa'ik ${d} mas.` : ` La stsa'ik ${-d} jutebxan.`;
          },
          resultadoGrupo: (r) => `Te melele ${r} ta 100.`,
          ahora: "Ya'yel, ¿melel me ma' melel?",
          tuEstimacion: "Bin la anop",
          datoReal: "Melel dato",
          tituloGrafica: (q, l, a) => `Bin la anop sok te melele: ${q} ta ${l}, ${a}`,
          resumen: (p) => `Bin la anop ay jich bit'il ${p} puntos ta stojol te melel dato.`,
          item: (q, l, p, r) => `${q} ta ${l}: la anop ${p}, te melele ${r}.`,
        },
        enTuCaso: {
          titulo: "¿Sok ate?",
          igual: (l) => `Ta ${l} ja' nix jich:`,
          distinto: (l) => `Ta ${l} yan:`,
          empate: (l) => `Ta ${l} ja' nix jich bit'il:`,
          sexo: (m, h, a, pct) => `ta ${a} la stsa'ik ${pct(m)} te antsetik sok ${pct(h)} te winiketik.`,
          mujeres: "Antsetik", hombres: "Winiketik",
          tituloSexo: (l, a) => `Tsa'el yu'un antsetik sok winiketik ta ${l}, ${a}`,
          campoSinDatos: (l) => `Ta ${l} ma' bayeluk secciones ta k'altik yu'un ya jojk'oytik.`,
          campo: (d, pct) => ({
            coincide: `ta jun tsa'el, te k'altik la stsa' jich bit'il o mas ta stojol te muk'ul lum. Ta ${d.anio}: ${pct(d.rural)} ta k'altik sok ${pct(d.urbana)} ta muk'ul lum.`,
            empate: `ta ${d.anio} te k'altik sok te muk'ul lum ja' nix jich: ${pct(d.rural)} sok ${pct(d.urbana)}.`,
            contrario: `te k'altik jutebxan la stsa' ta stojol te muk'ul lum ta spisil te tsa'el. Ta ${d.anio}: ${pct(d.rural)} ta k'altik sok ${pct(d.urbana)} ta muk'ul lum.`,
          }[d.relacion]),
          rural: "K'altik", urbana: "Muk'ul lum",
          tituloCampo: (l, a) => `Tsa'el ta k'altik sok muk'ul lum ta ${l}, ${a}`,
          intermedias: (d, pct) => {
            const i = `${d.intermedia[0]}, ${pct(d.intermedia[1])}`;
            const p = `${d.presidencial[0]}, ${pct(d.presidencial[1])}`;
            return {
              coincide: `te intermedia mas bayel tsa'el (${i}) ma' sts'akaj te presidencial mas juteb (${p}).`,
              empate: `te intermedia mas bayel tsa'el (${i}) nopol ta presidencial mas juteb (${p}).`,
              contrario: `te intermedia ${d.intermedia[0]} (${pct(d.intermedia[1])}) mas ta stojol te presidencial ${d.presidencial[0]} (${pct(d.presidencial[1])}).`,
            }[d.relacion];
          },
          presidencial: "Presidencial", intermedia: "Intermedia",
          tituloElecciones: (l) => `Tsa'el ta ${l}`,
          tendencia: (d, pct) => {
            const s = d.intermedias.map(([a, v]) => `${pct(v)} ta ${a}`).join(", ");
            return {
              coincide: `te tsa'el la smuy ta jujun intermedia: ${s}.`,
              empate: `ma' bayel la sjel sba: ${s}.`,
              contrario: `te tsa'el la yal ta jun intermedia: ${s}.`,
            }[d.relacion];
          },
          tituloIntermedias: (l) => `Tsa'el ta intermedias ta ${l}`,
          municipioIgual: (m) => `Ta ${m} ja' nix jich bit'il ta México:`,
          municipioDistinto: (m) => `Ta ${m} yan ta stojol te México:`,
          municipioEmpate: (m) => `Ta ${m} ja' nix jich bit'il:`,
          municipioUmbral: (m, u) => `Ta ${m} ma' bayeluk ants winik ta lista nominal (ma' sts'akaj ${u.toLocaleString("es-MX")}); ma' xju' jun lek dato.`,
          municipioFaltan: (m) => `${m} ma' sts'akaj spisil te tsa'el; ma' xju' ya jojk'oytik.`,
          tituloEleccionesMunicipio: (m, e) => `Tsa'el ta ${m} sok ${e}`,
          tituloIntermediasMunicipio: (m, e) => `Intermedias ta ${m} sok ${e}`,
          primerVoto: (d, v18, prom, l, pct) => ({
            coincide: `te mach'atik ay 18 sjabilal la stsa'ik ${pct(v18)}, mas ta stojol te promedio ta ${l} (${pct(prom)}).`,
            empate: `te mach'atik ay 18 sjabilal la stsa'ik ${pct(v18)}; te promedio ta ${l}: ${pct(prom)}.`,
            contrario: `te mach'atik ay 18 sjabilal la stsa'ik ${pct(v18)}, jutebxan ta stojol te promedio ta ${l} (${pct(prom)}).`,
          }[d.relacion]),
          tuEdad: (e, l, v, q, a) => `Ta ${a} ay ${e} asjabilal. Ta ${l}, ta 100 ${q}, la stsa'ik ${v}.`,
          cuandoCumplas: (l, v, a) => `K'alal ya xk'ot 18 asjabilal: ta ${l}, ta 100 mach'atik ay 18 sjabilal, la stsa'ik ${v} ta ${a}.`,
          a18: (l) => `18 ja'wil ta ${l}`,
          aTuEdad: (q, l) => `${q} ta ${l}`,
          promedio: (l) => `Promedio ta ${l}`,
          tituloEdad: (l, a) => `Tsa'el ta sjabilal ta ${l}, ${a}`,
          jovenes: (d, j, a, pct) => `ta ${a} la stsa'ik ${pct(j)} te mach'atik ay 18 k'alal 29 sjabilal.`,
          jovenesQuien: "mach'atik ay 18 k'alal 29 sjabilal",
          tituloUnidades: (q, l, a) => `100 ${q} ta ${l}: jayeb la stsa'ik ta ${a}`,
          sesentas: (d, pct) => `te mach'atik mas la stsa'ik ta ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}).`,
          mayores: (d, pct) => (d.relacion === "coincide"
            ? `te mach'atik jutebxan la stsa'ik ta ${d.anio}: 85 ja'wil o mas (${pct(d.valor)}).`
            : `te mach'atik jutebxan la stsa'ik ta ${d.anio}: ${TEXTOS.perfil.grupoLegible(d.grupo)} (${pct(d.valor)}); 85 ja'wil o mas: ${pct(d.v85)}.`),
          tuGrupo: (g, v, l, a, pct) => `Ta ${a} te mach'atik jich bit'il ate, ${TEXTOS.perfil.grupoLegible(g)}, la stsa'ik ${pct(v)} ta ${l}.`,
          tituloGrupos: (l, a) => `Tsa'el ta sjabilal ta ${l}, ${a}`,
        },
        historiaVotante: {
          titulo: "Akuxlejal bit'il ya atsa'",
          intro: (l) => `Bit'il la stsa'ik te mach'atik jich bit'il ate ta ${l}, ta jujun tsa'el.`,
          introMenor: (l) => `Bit'il la stsa'ik te mach'atik ay 18 sjabilal ta ${l}.`,
          introSinEdad: (l) => `Bit'il la stsa' te ${l} ta jujun tsa'el.`,
          tipo: (p) => (p ? "Presidencial" : "Intermedia"),
          tenias: (e) => `Ay ${e} asjabilal.`,
          hitoEdad: (e) => `${e} ja'wil`,
          hitoValor: (v) => `${v} ta 100`,
          hitoGrupo: (g) => `(tsobol ${g})`,
          hitoPais: "(dato México)",
          valor: (v, q, l) => `La stsa'ik ${v} ta 100 ${q} ta ${l}.`,
          valorTotal: (v, l) => `La stsa'ik ${v} ta 100 ta ${l}.`,
          proxima: (f) => `Te yan atsa'el: ${f}.`,
          primera: (a, esP, f) => `Te sba atsa'el: ${esP ? f : a}.`,
          porMarcar: "¿Ya ak'an ya atsa' ini?",
          columnas: ["Tsa'el", "Bit'il", "Ja'wil", "Ta 100"],
          fuente: (d, h) => `Banti lok'em: INE, Conteos Censales de Participación Ciudadana, ${d}–${h}.`,
        },
        perfil: {
          titulo: "¿Bit'il ya stsa'ik te mach'atik jich bit'il ate?",
          grupoLegible: (g) => (g.includes("más") ? `${parseInt(g, 10)} ja'wil o mas` : `${g.replace("–", " k'alal ")} ja'wil`),
          edadLegible: (e) => (e >= 85 ? "85 ja'wil o mas" : `${e} ja'wil`),
          personas: "ants winiketik",
          tituloUnidades: (q, l, a) => `100 ${q} ta ${l}: jayeb la stsa'ik ta ${a}`,
          quien: (r) => `mach'atik ay ${r.nivel === "grupo" ? TEXTOS.perfil.grupoLegible(r.grupo) : TEXTOS.perfil.edadLegible(r.edad)}`,
          nota: (r, lugarPedido) => {
            if (r.nivel === "grupo") return ` Ta ${r.lugar} ma' bayeluk mach'atik ay ${TEXTOS.perfil.edadLegible(r.edad)}; yu'un ya jtuuntestik te stsobolal.`;
            if (r.nivel === "pais") return ` Ta ${lugarPedido} ma' bayeluk ants winik ta sjabilal ini; yu'un ya jtuuntestik te dato México.`;
            return "";
          },
          todoPais: "Spisil México",
          todo: (e) => `Spisil ${e}`,
          mensajeEdad: ({ edad, lugar, quien, valor, anio }) => `Ta ${anio} ay ${edad} asjabilal. Ta ${lugar}, ta 100 ${quien}, la stsa'ik ${valor}.`,
          mensaje: ({ lugar, grupo, valor, anio, menor }) => {
            const b = grupo ? `Ta ${lugar}, ta 100 mach'atik ay ${grupo}, la stsa'ik ${valor} ta ${anio}.`
              : `Ta ${lugar} la stsa'ik ${valor} ta 100 ta ${anio}.`;
            return menor ? `K'alal ya xk'ot 18 asjabilal: ${b}` : b;
          },
          comparaEstado: (e, ve, vp) => `Te promedio ta ${e}: ${ve} ta 100; ta México: ${vp} ta 100.`,
          comparaPais: (vp) => `Te promedio ta México: ${vp} ta 100.`,
          contexto: "Bit'il la stsa' jujun tsobol ta México.",
          graficaTitulo: (a) => `Tsa'el ta ${a}`,
          graficaGrupos: (a) => `Tsa'el ta sjabilal ta spisil México, ${a}`,
          etiquetaGrupoLugar: (g, l) => `${g} ta ${l}`,
          fuente: (a) => `Banti lok'em: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
        },
        mapa: {
          leyenda: (d, h) => (h == null ? `${d} o mas` : d == null ? `jutebxan ta ${h}` : `${d} k'alal ${h}`),
          tituloLeyenda: "Ta 100 ants winik, la stsa'ik:",
          sinDato: "Ma'yuk dato (ma' bayeluk ants winik)",
          deCada100: (v) => (v == null ? "ma'yuk dato" : `${Math.round(v)} ta 100`),
        },
        explorar: {
          ver: { total: "Spisil ants winik", edad: "Ta sjabilal", sexo: "Antsetik sok winiketik", seccion: "K'altik sok muk'ul lum" },
          grupos: {
            edad: { "18": "18 ja'wil (sba tsa'el)", "18–29": "18 k'alal 29 ja'wil", "30–44": "30 k'alal 44 ja'wil", "45–59": "45 k'alal 59 ja'wil", "60–69": "60 k'alal 69 ja'wil", "70–84": "70 k'alal 84 ja'wil", "85 y más": "85 ja'wil o mas" },
            sexo: { Mujeres: "Antsetik", Hombres: "Winiketik" },
            seccion: { Urbana: "Muk'ul lum", Mixta: "Secciones mixtas", Rural: "K'altik" },
          },
          quien: {
            total: "ants winiketik",
            edad: { "18": "mach'atik ay 18 sjabilal", "18–29": "mach'atik ay 18 k'alal 29 sjabilal", "30–44": "mach'atik ay 30 k'alal 44 sjabilal", "45–59": "mach'atik ay 45 k'alal 59 sjabilal", "60–69": "mach'atik ay 60 k'alal 69 sjabilal", "70–84": "mach'atik ay 70 k'alal 84 sjabilal", "85 y más": "mach'atik ay 85 sjabilal o mas" },
            sexo: { Mujeres: "antsetik", Hombres: "winiketik" },
            seccion: { Urbana: "ants winiketik ta muk'ul lum", Mixta: "ants winiketik ta secciones mixtas", Rural: "ants winiketik ta k'altik" },
          },
          anio: (a, p) => `${a} (${p ? "presidencial" : "intermedia"})`,
          titulo: (q, a) => `Ta 100 ${q}, jayeb la stsa'ik ta ${a}`,
          estadoNombre: (n, v, d) => `${n}: ${TEXTOS.mapa.deCada100(v)}${v == null ? "" : d === 0 ? ", jich bit'il México" : `, ${Math.abs(d)} ${d > 0 ? "mas" : "jutebxan"} ta stojol México`}`,
          frase: (l, v, q, a, n, ref) => {
            const d = Math.round(v) - Math.round(n);
            const c = d === 0 ? `Jich bit'il te promedio ${ref} (${Math.round(n)}).` : `${Math.abs(d)} ${d > 0 ? "mas" : "jutebxan"} ta stojol te promedio ${ref} (${Math.round(n)}).`;
            return `Ta ${a} la stsa'ik ${Math.round(v)} ta 100 ${q} ta ${l}. ${c}`;
          },
          lugar: (n, t) => `Ay ta ${n} ta ${t} estados.`,
          sinDato: (l) => `Ta ${l} ma' bayeluk ants winik ta tsobol ini; ma' xju' jun lek dato.`,
          soloTotal: "Ta municipio ja' nax ay te dato yu'un spisil ants winik.",
          munSinDato: (m) => `${m} ma' bayeluk ants winik ta lista nominal, o ma'to ay; ma' xju' jun lek dato.`,
          tituloSerie: (q, d, h) => `Ta 100 ${q}, jayeb la stsa'ik ${d} k'alal ${h}`,
          pais: "México", delPais: "ta México", deLugar: (n) => `ta ${n}`,
          colEstado: "Estado", colMunicipio: "Municipio", colValor: "Ta 100", colDifCon: (r) => `Sok ${r}`,
          ordenar: (c) => `Chapa ta ${c.toLowerCase()}`,
          tablaEstados: "Ila' spisil te estados ta jun tabla",
          tablaMunicipios: (e) => `Ila' te municipios ta ${e}`,
          fuente: (a) => `Banti lok'em: INE, Conteos Censales de Participación Ciudadana, ${a}.`,
          copiado: "Laj ta copiar te enlace.",
          copiaManual: (u) => `Copiara: ${u}`,
          miEstado: (n) => `Ila' jestado (${n})`,
          municipio: { visibles: (n) => `${n} municipios.`, ninguno: "Ma'yuk." },
        },
        atlas: {
          pct: (v) => (v == null ? "ma'yuk dato" : `${v.toFixed(1)}%`),
          puntos: (v) => `${Math.abs(v).toFixed(1)} puntos`,
          error: "Ma' xju' la yich' ilel te mapa.",
          escuchar: "Ab'ya",
          mapa: {
            tituloPais: "Tsa'el ta jujun estado",
            anio: (a, p) => `${a} · ${p ? "presidencial" : "intermedia"}`,
            desc: (t, a, lista) => `Smapail México. ${t}, ${a}. ${lista}`,
            listaEstados: (f) => `${f.map(([n, v]) => `${n}: ${v == null ? "ma'yuk dato" : `${v.toFixed(1)}%`}`).join("; ")}.`,
          },
          pasos: {
            regionesTitulo: "Wakeb regiones",
            regionesTexto: "Yu'un ya xanavotik ta México, la jtsobtik te estados ta wakeb regiones.",
            regionEtiqueta: (n, t) => `Región ${n} ta ${t}`,
            tablaEstados: "Ila' te estados ta jun tabla",
            colEstado: "Estado",
            colVoto: (a) => `La stsa'ik ta ${a}`,
          },
          compara: {
            frase: (e, a, d, l) => `Ta ${a}, ${e} la stsa' ${Math.abs(d) < 0.05 ? "jich bit'il México" : `${TEXTOS.atlas.puntos(d)} ${d > 0 ? "mas" : "jutebxan"} ta stojol México`}; ay ta ${l} ta 32 estados.`,
            votoEn: (e, a) => `la stsa'ik ta ${e} ta ${a}`,
            tituloHistoria: (d, h) => `Tsa'el ${d}–${h}`,
            tituloEdad: (a) => `Ta sjabilal, ${a}`,
            tituloSexo: (a) => `Antsetik sok winiketik, ${a}`,
            tituloSeccion: (a) => `K'altik sok muk'ul lum, ${a}`,
            fraseEdad: (e, g, d) => `Banti mas yan ta stojol México: te mach'atik ay ${TEXTOS.perfil.grupoLegible(g)}; ta ${e} la stsa'ik ${TEXTOS.atlas.puntos(d)} ${d > 0 ? "mas" : "jutebxan"}.`,
            colGrupo: "Tsobol", colAnio: "Tsa'el", nacional: "México", sinDato: "Ma'yuk dato",
          },
        },
        metodo: {
          umbral: (n) => `Ma' ya jak' ta ilel te dato yu'un jun tsobol teme ma' sts'akaj ${n.toLocaleString("es-MX")} ants winik ta lista nominal: ma' lekuk te dato. K'alal jich, ya awil «ma'yuk dato».`,
          nota: "Tsa'el = mach'atik la stsa'ik ÷ (mach'atik la stsa'ik + mach'atik ma' la stsa'ik), sok te lista nominal. Ma' och te casillas especiales sok te tsa'el ta yan lum.",
        },
      },
      html: {
        '.nav-principal a[data-seccion="inicio"] span': "Sliwanel",
        '.nav-principal a[data-seccion="juego"] span': "Tajimal",
        '.nav-principal a[data-seccion="mapa"] span': "Mapa",
        '.nav-principal a[data-seccion="metodo"] span': "Ajtayel",
        "#t-lectura": "Bit'il ya awil",
        "#portada-entrada": "Te sjunal INE yu'un mach'atik la stsa'ik ta 2009 k'alal ta 2024. Tsa' bit'il ya awil.",
        '.puerta[data-ir="instrucciones"] .puerta-titulo': "Tajimal: Mitos vs. Datos",
        "#puerta-juego-tiempo": "Ta 5 minutos",
        '.puerta[data-ir="mapa"] .puerta-titulo': "Ila' te mapa",
        "#puerta-mapa-txt": "Ila' bit'il ya stsa'ik ta awestado sok ta amunicipio.",
        "#puerta-mapa-tiempo": "Ta 3 minutos",
        '.enlaces-portada [data-ir="talleres"]': "¿Ya ajchanubtesej? Modo salón sok jun →",
        "#t-talleres": "Yu'un chanubtesel",
        "#talleres .entrada": "Yu'un ya stajinik bayel ants winik sok jun proyector, o ta jun.",
        ".opcion-taller:nth-of-type(1) h3": "Modo salón",
        ".opcion-taller:nth-of-type(1) p": "Jun jojk'obil ta jujun pantalla sok te tsobol ya stsa' sok sk'ab.",
        "#entrar-salon": "Lijkesa te modo salón",
        ".opcion-taller:nth-of-type(2) h3": "Yu'un ya yich' imprimir",
        ".opcion-taller:nth-of-type(2) p": "Tarjetas sok te k'op sok sjak'ojibal.",
        ".opcion-taller:nth-of-type(2) a": "Jama' yu'un imprimir",
        ".opcion-taller:nth-of-type(3) h3": "Guía",
        ".opcion-taller:nth-of-type(3) p": "Jun chanubtesel ta 20 minutos (ta español).",
        ".opcion-taller:nth-of-type(3) a": "Ilbe sk'oplal te guía",
        '#talleres [data-ir="portada"]': "Sutnan",
        "#t-instr": "Bit'il ya yich' tajinel",
        ".pasos li:nth-child(1) > span:last-child": "Ilbe sk'oplal te k'ope. Jayeb mitos, jayeb melel.",
        ".pasos li:nth-child(2) > span:last-child": "Tsa': Melel me Ma' melel.",
        ".pasos li:nth-child(3) > span:last-child": "Ila' te datos. Jun sello sok jun gráfica ya yalbat bin melel.",
        ".nota-papel p": "¿Bin te tsa'el? Jayeb ants winik ta 100 la xbajik ta tsa'el. Teme ya yal 60%, la stsa'ik 60 ta 100.",
        '#instrucciones [data-ir="perfil"]': "Ya jlijkestik",
        "#t-perfil-pantalla": "Ba'yel: ¿mach'a ate ta k'op ini?",
        "#perfil .entrada": "Sok asjabilal sok awestado, ya awil bit'il ya stsa'ik te mach'atik jich bit'il ate.",
        'label[for="p-edad"]': "Jayeb asjabilal",
        "#edad-ayuda": "15 k'alal 100 ja'wil.",
        'label[for="p-estado"]': "Awestado",
        ".privacidad span": "Ma' ya jk'ejtik sok ma' ya jtakik te asjak'ojibal.",
        "#perfil-continuar": "Ba'an to",
        "#perfil-no-decir": "Ma' ya jk'an ya jkal",
        "#momento .folio": "Ak'op",
        "#iniciar": "Ya jlijkestik",
        '#momento [data-ir="perfil"]': "Ya jk'ex jdatos",
        '.opcion[data-respuesta="cierto"] span:last-child': "Melel",
        '.opcion[data-respuesta="falso"] span:last-child': "Ma' melel",
        "#est-ver": "Ila' te dato",
        "#ver-en-mapa": "Ila' ta mapa →",
        ".mas-contexto > summary": "Yan to k'op",
        "#discusion strong": "Ya jk'opontik:",
        ".g-tabla > summary": "Ila' te datos ta jun tabla",
        "#paso-siguiente": "Yan",
        "#paso-atras": "Sutnan",
        "#paso-1 .plegable summary": "Asjak'ojibal",
        ".invita-mapa button": "¿Sok ta awestado? Ila' ta mapa →",
        "#estimaciones summary": "Ila' jujun",
        "#t-paso-4": "Ak'op sok atarjeta",
        "#t-compromiso": "Tsa' jun k'op:",
        "#compartir": "Ak'a atarjeta",
        "#descargar": "Yalesa",
        "#reto-generacion": "K'opona jun ants winik yan generación",
        "#copiar": "Copiara te enlace",
        "#paso-4 .enlaces-portada a": "INE",
        '#paso-4 [data-ir="mapa"]': "Ila' te mapa",
        ".jugar-otra": "Tajinan yan buelta",
        ".llamado li:nth-child(1)": "Ilbe sk'oplal ta fuentes oficiales ba'yel te ya atak jun ajtayel.",
        ".llamado li:nth-child(2)": "K'elo me lek te acredencial yu'un ya atsa'.",
        ".llamado li:nth-child(3)": "Tsa'an ta jujun tsa'el.",
        "#cierre .boton.primario": "INE",
        '#cierre [data-ir="mapa"]': "Ila' te mapa",
        "#cierre .enlace-imprimible": "Yu'un imprimir",
        "#t-mapa": "Ila' te alumal",
        "#mapa > .entrada": "Ila' bit'il la stsa'ik ta jujun estado sok municipio, 2009 k'alal 2024.",
        "#volver-juego": "← Sutnan ta tajimal",
        "#tab-explorar": "Ila'",
        "#tab-recorrido": "Xanavan ta regiones",
        ".mx-campo:nth-child(1) .campo-titulo": "Tsa'el",
        ".mx-campo:nth-child(2) .campo-titulo": "Bin ya awil",
        ".mx-campo:nth-child(3) .campo-titulo": "Tsobol",
        "#mx-ayuda": "Tsa' jun estado ta mapa, o sok te teclado (flechas sok Enter), o ta lista.",
        "#mx-leyenda-t": "Ta 100 ants winik, la stsa'ik:",
        "#mx-pais": "Ila' spisil México",
        'label[for="mx-estado"]': "Estado",
        '#mx-estado option[value=""]': "Tsa' jun estado",
        "#mx-mi-edad": "Ila' te mach'atik jich bit'il jo'on",
        'label[for="mx-municipio"]': "Sa'a jun municipio",
        "#mx-indicacion": "Tsa' jun estado ta mapa me ta lista.",
        "#mx-ponte": "¿Ya ana' awestado? Ila' →",
        "#mx-mas": "Ila' ta sjabilal, antsetik sok winiketik →",
        "#mx-copiar": "Copiara te enlace",
        "#panel-recorrido > .entrada": "¿Banti mas ya stsa'ik ta México? Yalan k'unk'un: te mapa ya xbaj ta jujun región sok ta awestado.",
        "#panel-recorrido > p > [data-a-compara]": "Ila' awestado ya'yel",
        "#a-t-portada": "Tsa'el ta México",
        ".at-paso-portada .at-texto": "Jun be ta mapa: spisil México, jujun región sok awestado.",
        "#a-t-final": "¿Sok awestado?",
        ".at-paso-final > p:not([id])": "Tsa' awestado yu'un ya awil bit'il ya stsa'. Ma' ya jk'ejtik bin ya atsa'.",
        'label[for="a-elige-estado"]': "Awestado",
        '#a-elige-estado option[value=""]': "Tsa' jun estado",
        '#a-elige-estado-2 option[value=""]': "Tsa' jun estado",
        "#a-ir-compara": "Jojk'oya sok México →",
        "#a-t-compara": "Awestado sok México",
        "#a-compara-vacio": "Tsa' awestado:",
        'label[for="a-elige-estado-2"]': "Estado",
        ".at-compara-controles span.at-campo-titulo": "Tsa'el",
        "#t-metodo": "¿Bit'il ya yich' ajtayel?",
        "#metodo > .entrada": "Spisil te ajtayeletik ya xlok' ta jun nax fuente sok jun nax ya yich' ajtayel.",
        "#metodo h3:nth-of-type(1)": "Tsa'el",
        "#metodo p:nth-of-type(3)": "Ya jkaltik «ta 100»: teme la stsa'ik 60%, la stsa'ik 60 ta 100 ants winik.",
        "#metodo h3:nth-of-type(2)": "Banti lok'em",
        "#metodo p:nth-of-type(4)": "INE, Conteos Censales de Participación Ciudadana, 2009 k'alal 2024. Datos abiertos; ma'yuk sdatos mach'a nax.",
        "#metodo h3:nth-of-type(3)": "Ma' bayeluk ants winik",
        "#metodo h3:nth-of-type(4)": "Lenguas indígenas",
        "#metodo h3:nth-of-type(5)": "Bin ma' ya jk'ejtik",
        "#metodo p:nth-of-type(7)": "Asjabilal, awestado, amunicipio sok asjak'ojibal ja' nax ay ta página ini. Ma' ya jk'ejtik, ma' ya jtakik.",
      },
      niveles: {
        "Así vota México": { nombre: "Bit'il ya stsa' te México", intro: "Ba'yel: mach'atik ya stsa'ik sok ta bin elecciones." },
        "El primer voto": { nombre: "Sba tsa'el", intro: "Ya'yel, te yo'tan te k'ope: bin ya xk'ot ta pasel k'alal ya xk'ot 18 asjabilal." },
        "Que el primer voto no sea el último": { nombre: "Ma' me ja' xlaj ta sba tsa'el", intro: "¿Bin ya xk'ot ta pasel ta patil? Ya kiltik ta sjabilal." },
      },
      cierre: {
        titulo: "Ma' me ja' xlaj ta sba atsa'el",
        texto: "K'alal ay {0} sjabilal, mas ya stsa'ik ta stojol te promedio nacional, pero ta patil ya yal k'alal nopol {1} sjabilal. Ma' me ja' xlaj ta sba atsa'el.",
      },
      mitos: {
        sexo: {
          enunciado: "Te winiketik mas ya stsa'ik ta stojol te antsetik.",
          resumen: "Te antsetik mas la stsa'ik ta stojol te winiketik ta spisil te {0} tsa'el k'alal {1}. Ja' nax k'alal ay {2} sjabilal, te winiketik juteb mas la stsa'ik.",
          explicacion: "Te antsetik mas la stsa'ik ta stojol te winiketik ta spisil te {0} tsa'el k'alal {1}. Ta {2} la stsa'ik {3} te antsetik sok {4} te winiketik. Ja' nax k'alal ay {5} sjabilal, te winiketik juteb mas la stsa'ik.",
          dato: "te antsetik la stsa'ik ta {0}; te winiketik, {1}.",
          discusion: "¿Bin yu'un bayel ants winik ya xch'unik te mas ya stsa'ik te winiketik? ¿Bin yu'un mas ya stsa'ik te antsetik?",
          grafica: { titulo: "Tsa'el yu'un antsetik sok winiketik, {0}", nota: ["Ta {0} sba ich'ot ta ilel te no binaria ({1}); ma' och ta ini.", "Ta {0} sba ich'ot ta ilel te no binaria; ma' och ta ini."] },
        },
        campo: {
          enunciado: "Ta k'altik spisil ora jutebxan ya stsa'ik ta stojol te muk'ul lum.",
          resumen: "Ta spisil te {0} tsa'el, ta k'altik la stsa'ik jich bit'il o mas ta stojol te muk'ul lum. Ta {1} ja' nix jich: {2} sok {3}.",
          explicacion: "K'alal {0}, ta spisil te tsa'el, ta k'altik la stsa'ik jich bit'il o mas ta stojol te muk'ul lum. Ta {1}, la stsa'ik {2} ta k'altik sok {3} ta muk'ul lum. Ta {4} ja' nix jich: {5} sok {6}.",
          dato: "la stsa'ik ta k'altik ta {0}; ta muk'ul lum, {1}.",
          discusion: "¿Bin ya skoltay o ya yak' wokol yu'un ya xbajik ta tsa'el ta jun lum ta k'altik? ¿Sok ta jun muk'ul lum?",
          grafica: { titulo: "Tsa'el ta k'altik sok ta muk'ul lum, {0}", nota: "Te INE ya yal bin k'altik sok bin muk'ul lum. Ma' xvinaj te secciones mixtas." },
        },
        intermedias: {
          enunciado: "Ta elecciones intermedias jutebxan ya stsa'ik ta stojol te presidenciales.",
          resumen: "Ta {0} intermedias jutebxan la stsa'ik ta stojol te presidenciales. Ta intermedias ya stsa'ik diputados, ma' ja'uk te presidente.",
          explicacion: "Ta {0} intermedias jutebxan la stsa'ik ta stojol te {1} presidenciales: te intermedia mas bayel tsa'el ({2}, {3}) ma' sts'akaj te presidencial mas juteb ({4}, {5}). Ta intermedias ya stsa'ik diputados, ma' ja'uk te presidente.",
          dato: "la stsa'ik ta intermedia mas bayel ({0}). Te presidencial mas juteb ay {1} ({2}).",
          discusion: "¿Ya ana'ik bin ya yich' tsa'el ta jun elección intermedia? ¿Bin yu'un ma' bayel ya yich' ilel?",
          grafica: { titulo: "Tsa'el ta spisil México, {0}" },
        },
        "primer-voto": {
          enunciado: "Te mach'atik ay 18 sjabilal jutebxan ya stsa'ik ta stojol te promedio nacional.",
          resumen: "K'alal ay {0} sjabilal, mas ya stsa'ik ta stojol te promedio nacional, ta spisil te {1} tsa'el. Ta patil ya yal k'alal {2} k'alal ay {3} sjabilal.",
          explicacion: "K'alal ay {0} sjabilal, mas ya stsa'ik ta stojol te promedio nacional, ta spisil te {1} tsa'el k'alal {2}. Ta {3} la stsa'ik {4} te mach'atik ay {5} sjabilal; te promedio nacional: {6}. Ta patil ya yal: ya xk'ot {7} k'alal ay {8} sjabilal, ta patil ya xmuy yan buelta.",
          dato: "la stsa'ik te mach'atik ay {0} sjabilal ta {1}. Te promedio nacional: {2}.",
          discusion: "¿Bin ya ana' o ya anop ta sba atsa'el? ¿Bin yu'un k'alal ay {0} sjabilal mas ya stsa'ik?",
          grafica: { titulo: "Tsa'el ta sjabilal, {0} k'alal {1} ja'wil, {2}" },
        },
        jovenes: {
          enunciado: "Te kerem ach'ixetik ma' ya stsa'ik.",
          resumen: "Ja' {0} ants winiketik. Jutebxan ya stsa'ik ta stojol te mach'atik ay {1} sjabilal o mas ({2}), pero ya stsa'ik.",
          explicacion: "Ta {0} la stsa'ik {1} te mach'atik ay {2} k'alal {3} sjabilal: {4}. K'alal {5} ma'yuk bin ora la stsa'ik jutebxan ta stojol jun ta yoxeb (te mas juteb: {6} ta {7}). Jutebxan ya stsa'ik ta stojol te mach'atik ay {8} sjabilal o mas ({9} ta {10}).",
          dato: "te mach'atik ay {0} k'alal {1} sjabilal la stsa'ik ta {2}.",
          discusion: "¿Bin ya spas te jun kerem o ach'ix ma' ya stsa' yan buelta ta patil te sba tsa'el? ¿Bin ya skoltay yu'un ya stsa' to?",
          grafica: { titulo: "Tsa'el ta sjabilal, {0}" },
        },
        sesentas: {
          enunciado: "Te mach'atik ay 60 k'alal 69 sjabilal, ja' mas ya stsa'ik.",
          resumen: "Ta spisil te {0} tsa'el, te mach'atik mas la stsa'ik ay {1} k'alal {2} sjabilal. Te promedio nacional: {3}.",
          explicacion: "Ta spisil te {0} tsa'el k'alal {1}, te mach'atik mas la stsa'ik ay {2} k'alal {3} sjabilal. Ta {4} ja' te mach'atik ay {5} sjabilal, sok {6}, mas ta stojol te promedio nacional ({7}).",
          dato: "la stsa'ik te mach'atik ay {0} sjabilal ta {1}.",
          discusion: "¿Bin stalel o bin la yil ya spas te jun ants winik ya stsa' ta spisil skuxlejal?",
          grafica: { titulo: "Te mach'atik mas la stsa'ik ta jujun tsa'el" },
        },
        mayores: {
          enunciado: "Te mach'atik ay 85 sjabilal o mas, ja' jutebxan ya stsa'ik.",
          resumen: "Ja' te mach'atik jutebxan la stsa'ik ta spisil te {0} tsa'el. Ma' bayeluk: {1} ta lista nominal.",
          explicacion: "Ta spisil te {0} tsa'el k'alal {1}, te mach'atik ay {2} sjabilal o mas jutebxan la stsa'ik. Ta {3} la stsa'ik {4}; te mach'atik ay {6} sjabilal, {5}. Ma' bayeluk: {7} ta lista nominal.",
          dato: "la stsa'ik te mach'atik ay {0} sjabilal o mas ta {1}.",
          discusion: "¿Bin wokol ay ta stojol jun ants winik ay {0} sjabilal o mas yu'un ya xbaj ta tsa'el? ¿Bit'il ya xju' ya jkoltaytik?",
          grafica: { titulo: "Tsa'el ta sjabilal, {0}" },
        },
        tendencia: {
          enunciado: "Ta elecciones intermedias, te tsa'el yakal ta yalel k'alal 2009.",
          resumen: "Jujun intermedia mas bayel tsa'el ay ta stojol te ba'yel. Yu'un lek ya ajojk'oy, ila' te tsa'el ja' nix jich.",
          explicacion: "Jujun elección intermedia mas bayel tsa'el ay ta stojol te ba'yel. La stsa'ik {0} ta {1}, {2} ta {3} sok {4} ta {5}. Yu'un lek ya ajojk'oy, ila' te tsa'el ja' nix jich, yu'un ta presidenciales spisil ora mas bayel ya stsa'ik.",
          dato: "la stsa'ik ta intermedia {0}; ta {2}, {1}.",
          discusion: "Teme ya xju' ya xmuy te tsa'el ta intermedias, ¿bin ya xju' ya apasik yu'un ya xmuy to?",
          grafica: { titulo: "Tsa'el ta elecciones intermedias" },
        },
      },
      atlas: {
        pais: { titulo: "México, {0}", texto: "Ta {0} la stsa'ik {1} te mach'atik ay ta lista nominal. Pero te promedio ini ya snak'ulan jun México yan ta jujun lum." },
        extremos: { titulo: "Ma' spisiluk México ja' nix jich ya stsa'", texto: "Ta {0}, {e0} mas la stsa' ({1}) sok {e1} jutebxan ({2}): {3} puntos." },
        intermedia: { titulo: "K'alal ma'yuk presidencial, jutebxan ya stsa'ik", texto: "Ta {0}, ma'yuk presidencial, la stsa'ik {1}: {2} puntos jutebxan ta stojol {3}. La yal ta {4} ta {5} estados." },
        noroeste: { titulo: "Te región banti jutebxan ya stsa'ik", texto: "Ta {0} ta {1} tsa'el k'alal {2}, Noroeste jutebxan la stsa'. Ta {3} la stsa'ik {4}, {5} puntos jutebxan ta stojol México.", extra: "Te skerem ach'ixetik ({0} k'alal {1} ja'wil) jutebxan ya stsa'ik ta wakeb regiones: {2} ta {3}." },
        norte: { titulo: "Ma' ja' nix jich", texto: "Ta {0}, {e0} la stsa' {1} sok {e1} {2}: {3} puntos ta jun nax región.", extra: "{e0} ay ta {0} ta {1} sok {e1} ta {2}." },
        occidente: { titulo: "Kerem ach'ixetik sok mamal me'eletik, mas nopol", texto: "Li'i te kerem ach'ixetik sok mamal me'eletik ja' nix jich ya stsa'ik: ta {0}, {1} te mach'atik ay {2} k'alal {3} sjabilal sok {4} te mach'atik ay {5} sjabilal o mas; {6} puntos.", extra: "Ta spisil México, {0} puntos." },
        centro: { titulo: "Te región banti mas ya stsa'ik", texto: "Centro mas la stsa' ta {0}: {1}, {2} puntos mas ta stojol México.", extra: "Li' ay te {e0}, ja' nax te estado ini mas la stsa' ta intermedia {0} ({1}) ta stojol te presidencial {2} ({3})." },
        sur: { titulo: "K'altik mas ya stsa'", texto: "Ta Sur, te k'altik mas ya stsa' ta stojol te muk'ul lum: {0} sok {1} ta {2}.", extra: "Ta {0} jutebxan la stsa'ik ({1}); ta {2} la stsa'ik {3}." },
        golfo: { titulo: "{e0} ta sba", texto: "{e0} mas la stsa' ta {0} ta {1} tsa'el k'alal {2}; ta {3} la stsa' {4}.", extra: "Spisil te región la stsa' {0} ta {1}, mas ta stojol México." },
      },
    },
  };

  const pedida = new URLSearchParams(location.search).get("lengua");
  const L = LENGUAS[pedida] || null;

  // ---------- plantillas con las cifras de procesar.py

  // Cifras en el orden en que aparecen: rangos (65–69), decimales, porcentajes y «11.9 millones».
  const CIFRAS = /\d+–\d+|\d+(?:\.\d+)?(?:\s(?:millones|mil))?%?/g;

  // Nombres de estado en el orden en que aparecen (el más largo primero: «Ciudad de México» antes que «México»).
  function nombresEn(texto, estados) {
    const hallados = [];
    estados.slice().sort((a, b) => b.length - a.length).forEach((n) => {
      let i = texto.indexOf(n);
      while (i >= 0) {
        if (!hallados.some((h) => i < h.fin && h.ini < i + n.length)) hallados.push({ ini: i, fin: i + n.length, n });
        i = texto.indexOf(n, i + n.length);
      }
    });
    return hallados.sort((a, b) => a.ini - b.ini).map((h) => h.n);
  }

  // Si las cifras (o los estados) no coinciden con la plantilla, se deja el texto en español.
  // Una plantilla puede ser una lista de variantes: se usa la primera que coincide.
  function plantilla(es, tr, estados = []) {
    if (Array.isArray(tr)) {
      for (const v of tr) {
        const r = plantilla(es, v, estados);
        if (r !== es) return r;
      }
      return es;
    }
    if (!tr || !es) return es;
    const max = (re) => Math.max(-1, ...[...tr.matchAll(re)].map((m) => Number(m[1])));
    const cifras = es.match(CIFRAS) || [];
    if (max(/\{(\d+)\}/g) + 1 !== cifras.length) return es;
    let nombres = [];
    if (/\{e\d\}/.test(tr)) {
      nombres = nombresEn(es, estados);
      if (max(/\{e(\d)\}/g) + 1 !== nombres.length) return es;
    }
    return tr.replace(/\{e(\d)\}/g, (_, i) => nombres[i]).replace(/\{(\d+)\}/g, (_, i) => cifras[i]);
  }

  const etiqueta = (s) => (typeof s === "string" ? L.etiquetas.reduce((t, [re, r]) => t.replace(re, r), s) : s);
  const fuente = (s) => (typeof s === "string" ? s.replace(/^Fuente:/, L.fuente) : s);

  function grafica(g, t = {}) {
    if (!g) return g;
    const r = { ...g, titulo: plantilla(g.titulo, t.titulo) };
    if (g.nota) r.nota = plantilla(g.nota, t.nota);
    if (g.x_titulo) r.x_titulo = etiqueta(g.x_titulo);
    if (g.x) r.x = g.x.map(etiqueta);
    if (g.series) r.series = g.series.map((s) => ({ ...s, nombre: etiqueta(s.nombre) }));
    if (g.items) r.items = g.items.map((i) => ({ ...i, etiqueta: etiqueta(i.etiqueta) }));
    if (g.referencia) r.referencia = { ...g.referencia, etiqueta: etiqueta(g.referencia.etiqueta) };
    if (g.etiqueta) r.etiqueta = etiqueta(g.etiqueta);
    return r;
  }

  // ---------- aplicar

  // Copia sobre TEXTOS solo las claves traducidas; lo demás queda en español.
  function mezclar(destino, origen) {
    Object.entries(origen).forEach(([k, v]) => {
      if (v && typeof v === "object" && !Array.isArray(v) && destino[k] && typeof destino[k] === "object") mezclar(destino[k], v);
      else destino[k] = v;
    });
  }

  // La misma página en otra lengua: conserva la edición (?entidad=), el reto y la sección (#mapa…).
  function enlace(clave) {
    const q = new URLSearchParams(location.search);
    if (clave === "es") q.delete("lengua");
    else q.set("lengua", clave);
    const busqueda = q.toString();
    return `${location.pathname}${busqueda ? `?${busqueda}` : ""}${location.hash}`;
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

  // Selector del panel «Aa»: cambia ?lengua= y vuelve a cargar.
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
    // Textos del mito en la lengua elegida; el veredicto y las cifras no cambian.
    mito(m) {
      const t = L && L.mitos[m.id];
      if (!t) return m;
      return {
        ...m,
        enunciado: t.enunciado || m.enunciado,
        resumen: plantilla(m.resumen, t.resumen),
        explicacion: plantilla(m.explicacion, t.explicacion),
        discusion: plantilla(m.discusion, t.discusion),
        dato: { ...m.dato, texto: plantilla(m.dato.texto, t.dato) },
        fuente: fuente(m.fuente),
        grafica: grafica(m.grafica, t.grafica),
      };
    },
    // «junio de 2027» → «junio 2027»: el mes queda como préstamo, sin la preposición del español.
    fecha: (s) => (L && typeof s === "string" ? s.replace(" de ", " ") : s),
    nivel: (n) => (L && L.niveles[n.nombre] ? { ...n, ...L.niveles[n.nombre] } : n),
    cierre: (c) => (L && c ? { ...c, titulo: L.cierre.titulo, texto: plantilla(c.texto, L.cierre.texto) } : c),
    // Hallazgos del recorrido (procesar_atlas.py): cifras y nombres de estado salen del texto en español.
    // Las claves (sexos, secciones, grupos) no se traducen: las usan los filtros y la URL.
    atlas(a) {
      if (!L) return a;
      const estados = a.estados.map((e) => e.nombre);
      const traducir = (p) => {
        const t = L.atlas[p.id] || {};
        return {
          ...p,
          titulo: plantilla(p.titulo, t.titulo, estados),
          texto: plantilla(p.texto, t.texto, estados),
          ...(p.extra ? { extra: plantilla(p.extra, t.extra, estados) } : {}),
        };
      };
      return { ...a, metodo: plantilla(a.metodo, L.metodoAtlas), apertura: a.apertura.map(traducir), regiones: a.regiones.map(traducir) };
    },
  };
})();
