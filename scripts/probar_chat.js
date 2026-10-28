/*
 * Prueba el motor de «Pregúntale a Boleta» sin navegador:
 *   node scripts/probar_chat.js            (resumen y errores)
 *   node scripts/probar_chat.js --todo     (además, cada respuesta)
 *
 * 1. Cada pregunta de docs/pruebas-chat.csv debe caer en su intención esperada
 *    (vacía = el bot debe decir que no sabe).
 * 2. Conversaciones de varias preguntas: el contexto («¿y en 2021?», «¿de qué estado?»).
 * 3. Ninguna respuesta con huecos ni «undefined».
 * 4. Náhuatl, maya y tseltal (chat-lenguas.js): docs/pruebas-chat-lenguas.csv, que cada sugerencia lleve a su
 *    intención, que las plantillas solo usen {datos} de la plantilla en español y que el español siga igual.
 * Sale con código 1 si algo falla, para usarlo en el workflow.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), "utf8");
const todo = process.argv.includes("--todo");

// textos.js y chat-motor.js son scripts del navegador: se cargan en un mismo contexto.
const contexto = vm.createContext({});
vm.runInContext(leer("site/js/textos.js"), contexto);
vm.runInContext(leer("site/js/chat-motor.js"), contexto);
const { ChatMotor, TEXTOS } = vm.runInContext("({ ChatMotor, TEXTOS })", contexto);

const motor = ChatMotor.crear({
  chat: JSON.parse(leer("site/data/chat.json")),
  atlas: JSON.parse(leer("site/data/atlas.json")),
  mitos: JSON.parse(leer("site/data/mitos.json")),
  textos: TEXTOS,
});

let fallas = 0;

// ---------- 1. preguntas sueltas
const filas = leer("docs/pruebas-chat.csv").trim().split(/\r?\n/).slice(1).map((l) => {
  const i = l.lastIndexOf(",");
  return { pregunta: l.slice(0, i), esperada: l.slice(i + 1) || null };
});
filas.forEach(({ pregunta, esperada }) => {
  const r = motor.responder(pregunta, motor.nuevoContexto());
  const ok = (r.intencion || null) === esperada;
  if (!ok) fallas += 1;
  if (!ok || todo) {
    console.log(`${ok ? "  ok " : "FALLA"} «${pregunta}» → ${r.intencion} (${(r.puntaje || 0).toFixed(2)}), se esperaba ${esperada}`);
    if (todo) console.log(`      ${r.texto}`);
  }
});
console.log(`Preguntas: ${filas.length - fallas} de ${filas.length} en la intención correcta.`);

// ---------- 2. conversaciones
const CONVERSACIONES = [
  { nombre: "seguir con otro año", pasos: [
    ["¿cuánto votó Jalisco?", "estado", /Jalisco/],
    ["¿y en 2021?", "estado", /2021.*Jalisco|Jalisco.*2021/],
    ["¿y Sonora?", "estado", /Sonora/],
  ] },
  { nombre: "pedir el estado que falta", pasos: [
    ["¿cuánto votó mi estado?", "estado", /¿De qué estado\?/],
    ["Oaxaca", "estado", /Oaxaca/],
  ] },
  { nombre: "el estado se queda para otras preguntas", pasos: [
    ["participación en Chiapas", "estado", /Chiapas/],
    ["¿y las mujeres?", "sexo", /Chiapas/],
    ["¿y en todo el país?", "sexo", /todo el país/],
  ] },
  { nombre: "comparar con el estado anterior", pasos: [
    ["cuánto votó Nuevo León", "estado", /Nuevo León/],
    ["compáralo con Coahuila", "comparar", /Nuevo León.*Coahuila/],
    ["¿y en 2018?", "comparar", /2018.*Nuevo León.*Coahuila/],
  ] },
  { nombre: "año sin datos", pasos: [
    ["¿cuánto votó Jalisco en 2027?", "anio_sin_datos", /Solo tengo datos/],
  ] },
];
CONVERSACIONES.forEach(({ nombre, pasos }) => {
  const ctx = motor.nuevoContexto();
  pasos.forEach(([pregunta, esperada, patron]) => {
    const r = motor.responder(pregunta, ctx);
    const ok = r.intencion === esperada && patron.test(r.texto);
    if (!ok) fallas += 1;
    if (!ok || todo) console.log(`${ok ? "  ok " : "FALLA"} [${nombre}] «${pregunta}» → ${r.intencion}: ${r.texto}`);
  });
});

// ---------- 3. ninguna respuesta con huecos ni «undefined»
const ctx = motor.nuevoContexto();
filas.forEach(({ pregunta }) => {
  const { texto } = motor.responder(pregunta, ctx);
  if (/undefined|NaN|\{\w+\}/.test(texto)) {
    fallas += 1;
    console.log(`FALLA respuesta incompleta para «${pregunta}»: ${texto}`);
  }
});

// ---------- 4. lenguas indígenas (borrador)
// Cada lengua en su propio contexto: lenguas.js cambia TEXTOS según ?lengua=.
const filasLenguas = leer("docs/pruebas-chat-lenguas.csv").trim().split(/\r?\n/).slice(1).map((l) => {
  const i = l.indexOf(","), j = l.lastIndexOf(",");
  return { lengua: l.slice(0, i), pregunta: l.slice(i + 1, j), esperada: l.slice(j + 1) || null };
});
const chatJson = JSON.parse(leer("site/data/chat.json"));
const porIdEs = Object.fromEntries(chatJson.intenciones.map((i) => [i.id, i]));
const huecos = (t) => new Set([...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
["nah", "yua", "tzh"].forEach((clave) => {
  const nodo = { textContent: "", setAttribute() {}, querySelector: () => nodo, addEventListener() {} };
  const cx = vm.createContext({
    location: { search: `?lengua=${clave}`, pathname: "/", hash: "" }, URLSearchParams,
    document: { getElementById: () => null, querySelectorAll: () => [], documentElement: {} },
  });
  ["textos.js", "lenguas.js", "chat-lenguas.js", "chat-motor.js"].forEach((f) => vm.runInContext(leer(`site/js/${f}`), cx));
  const { ChatMotor: M, TEXTOS: TX, Lengua, ChatLenguas } = vm.runInContext("({ ChatMotor, TEXTOS, Lengua, ChatLenguas })", cx);
  const L = ChatLenguas[clave];
  const mitos = JSON.parse(leer("site/data/mitos.json"));
  const mitosLengua = { ...mitos, niveles: mitos.niveles.map((n) => ({ ...n, mitos: n.mitos.map(Lengua.mito) })),
    proxima_eleccion: { ...mitos.proxima_eleccion, fecha: Lengua.fecha(mitos.proxima_eleccion.fecha) } };
  const m = M.crear({ chat: chatJson, atlas: JSON.parse(leer("site/data/atlas.json")), mitos: mitosLengua, textos: TX, lengua: L });
  let bien = 0, total = 0;
  const probar = (pregunta, esperada, etiqueta) => {
    const r = m.responder(pregunta, m.nuevoContexto());
    const ok = (r.intencion || null) === esperada && !/undefined|NaN|\{\w+\}/.test(r.texto);
    total += 1;
    if (ok) bien += 1; else fallas += 1;
    if (!ok || todo) {
      console.log(`${ok ? "  ok " : "FALLA"} [${clave}${etiqueta}] «${pregunta}» → ${r.intencion} (${(r.puntaje || 0).toFixed(2)}), se esperaba ${esperada}`);
      if (todo) console.log(`      ${r.lang ? "(es) " : ""}${r.texto}`);
    }
  };
  filasLenguas.filter((f) => f.lengua === clave).forEach((f) => probar(f.pregunta, f.esperada, ""));
  // Las sugerencias son botones: al tocarlas deben llevar a su intención.
  chatJson.intenciones.filter((i) => i.sugerencia).forEach((i) => {
    const s = i.tipo === "mito" ? `¿${mitosLengua.niveles.flatMap((n) => n.mitos).find((x) => x.id === i.mito).enunciado.replace(/\.$/, "")}?`
      : L.sugerencias[i.id] || i.sugerencia;
    probar(s, i.id, " sugerencia");
  });
  // El español se sigue entendiendo con la página en esta lengua.
  filas.forEach(({ pregunta, esperada }) => probar(pregunta, esperada, " en español"));
  // Plantillas: solo los {datos} de la plantilla en español.
  Object.entries(L.respuestas).forEach(([id, t]) => {
    const es = id === "mito" ? Object.values(porIdEs).find((i) => i.tipo === "mito").respuesta : porIdEs[id]?.respuesta;
    const sobran = es === undefined ? ["(intención desconocida)"] : [...huecos(t)].filter((k) => !huecos(es).has(k));
    if (sobran.length) { fallas += 1; console.log(`FALLA [${clave}] plantilla «${id}» usa ${sobran.join(", ")}`); }
  });
  const sinTraducir = chatJson.intenciones.filter((i) => i.tipo !== "mito" && !L.respuestas[i.id]).map((i) => i.id);
  if (sinTraducir.length) console.log(`[${clave}] responden en español: ${sinTraducir.join(", ")}`);
  console.log(`[${clave}] ${bien} de ${total} en la intención correcta.`);
});

console.log(fallas ? `${fallas} fallas.` : "Todo bien.");
process.exit(fallas ? 1 : 0);
