/*
 * Prueba el motor de «Pregúntale a Boleta» sin navegador:
 *   node scripts/probar_chat.js            (resumen y errores)
 *   node scripts/probar_chat.js --todo     (además, cada respuesta)
 *
 * 1. Cada pregunta de docs/pruebas-chat.csv debe caer en su intención esperada
 *    (vacía = el bot debe decir que no sabe).
 * 2. Conversaciones de varias preguntas: el contexto («¿y en 2021?», «¿de qué estado?»).
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

console.log(fallas ? `${fallas} fallas.` : "Todo bien.");
process.exit(fallas ? 1 : 0);
