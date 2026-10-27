"""
«Pregúntale a Boleta»: genera la base del chatbot sin LLM (site/data/chat.json).

El chatbot compara cada pregunta con las preguntas de ejemplo de cada intención y responde con la
más parecida (site/js/chat-motor.js). Aquí solo van las intenciones, sus ejemplos y las plantillas
de respuesta; las cifras las pone el navegador con los datos que ya generan procesar.py
(mitos.json) y procesar_atlas.py (atlas.json). Ninguna cifra se escribe a mano.

Entradas: site/data/atlas.json y site/data/mitos.json
Salida:   site/data/chat.json

El script se detiene (ChatNoValido) si una plantilla usa un dato que su tipo no tiene, si un mito
no tiene intención (o una intención apunta a un mito que ya no existe) o si un alias de estado
se repite. Para probar que cada pregunta cae en la intención correcta:
    node scripts/probar_chat.js
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "site" / "data"


class ChatNoValido(Exception):
    """La base del chatbot tiene un error: hay que corregir las intenciones antes de publicar."""


def exigir(condicion: bool, mensaje: str) -> None:
    if not condicion:
        raise ChatNoValido(mensaje)


# ---------------------------------------------------------------- datos que cada tipo de respuesta puede usar
# El motor (chat-motor.js) calcula estos valores con atlas.json y mitos.json.
DATOS_POR_TIPO = {
    "fijo": set(),
    "metodo": {"metodo"},
    "proxima": {"fecha", "tipo"},
    "pais": {"anio", "tipo", "pct"},
    "estado": {"estado", "anio", "tipo", "pct", "pais", "comparacion", "lugar"},
    "extremo": {"anio", "estado", "pct", "otro", "pct_otro", "diferencia"},
    "comparar": {"anio", "estado", "pct", "otro", "pct_otro", "comparacion"},
    "edad": {"lugar_texto", "anio", "lista", "grupo_max", "pct_max", "grupo_min", "pct_min"},
    "sexo": {"lugar_texto", "anio", "mujeres", "hombres", "comparacion"},
    "seccion": {"lugar_texto", "anio", "urbana", "mixta", "rural"},
    "historia": {"lugar_texto", "lista"},
    "tipos": {"presidenciales", "intermedias"},
    "region": {"anio", "lista"},
    "mito": {"enunciado", "veredicto", "resumen"},
}

# ---------------------------------------------------------------- intenciones
# requiere: datos sin los que no se puede responder (el bot los pide).
# usa: datos opcionales; si faltan, se toman del contexto o del valor por omisión (país, última elección).
# sugerencia: la pregunta que se muestra como botón cuando esta intención es una buena opción.
INTENCIONES = [
    {
        "id": "saludo", "tipo": "fijo",
        "ejemplos": ["hola", "buenas", "buenos dias", "buen dia", "buenas tardes", "buenas noches", "que tal", "hola boleta", "hey", "que onda"],
        "respuesta": "¡Hola! Soy Boleta. Pregúntame cómo vota México: por estado, por edad, mujeres y hombres, el campo y la ciudad, o si una frase es mito o dato.",
    },
    {
        "id": "ayuda", "tipo": "fijo",
        "sugerencia": "¿Qué te puedo preguntar?",
        "ejemplos": ["que te puedo preguntar", "ayuda", "que sabes", "que puedes hacer", "como funcionas",
                     "no se que preguntar", "de que sabes", "que preguntas respondes"],
        "respuesta": "Sé de participación electoral en las elecciones federales de 2009 a 2024, con datos del INE. Por ejemplo: «¿Cuánto votó Jalisco?», «¿Qué estado vota más?», «¿Votan más las mujeres?» o «¿Los jóvenes no votan?».",
    },
    {
        "id": "pais", "tipo": "pais", "usa": ["anio"],
        "sugerencia": "¿Cuánta gente votó en 2024?",
        "ejemplos": ["cuanta gente voto", "cuantos votaron en el pais", "participacion nacional", "cuanto se vota en mexico",
                     "porcentaje de participacion", "cuanta gente fue a votar en 2018", "que porcentaje voto",
                     "participacion en 2021", "cuantos votaron en la ultima eleccion", "cuanta gente vota en el pais"],
        "respuesta": "En {anio} ({tipo}) votó el {pct} de las personas en la lista nominal de todo el país.",
    },
    {
        "id": "estado", "tipo": "estado", "requiere": ["estado"], "usa": ["anio"],
        "sugerencia": "¿Cuánto votó mi estado?",
        "ejemplos": ["cuanto voto jalisco", "participacion en nuevo leon", "cuanta gente voto en oaxaca",
                     "como vota sonora", "que tanto vota mi estado", "cuanto vota yucatan", "participacion de chiapas en 2018",
                     "como le fue a puebla", "cuanto votaron en mi estado", "votaron mucho en colima"],
        "respuesta": "En {anio} ({tipo}), en {estado} votó el {pct}: {comparacion} el país ({pais}). Quedó en el lugar {lugar} de 32 estados.",
    },
    {
        "id": "estado_mas", "tipo": "extremo", "orden": "mas", "usa": ["anio"],
        "sugerencia": "¿Qué estado vota más?",
        "ejemplos": ["que estado vota mas", "donde se vota mas", "el estado con mas participacion",
                     "cual estado voto mas en 2021", "en que estado vota mas gente", "estado mas participativo",
                     "quien voto mas", "el primer lugar en participacion", "el estado con mayor participacion"],
        "respuesta": "En {anio}, el estado que más votó fue {estado}, con {pct}. El que menos, {otro}, con {pct_otro}: {diferencia} de diferencia.",
    },
    {
        "id": "estado_menos", "tipo": "extremo", "orden": "menos", "usa": ["anio"],
        "sugerencia": "¿Qué estado vota menos?",
        "ejemplos": ["que estado vota menos", "donde se vota menos", "el estado con menos participacion",
                     "cual estado voto menos en 2015", "en que estado vota menos gente", "estado menos participativo",
                     "quien voto menos", "el ultimo lugar en participacion", "donde vota menos la gente"],
        "respuesta": "En {anio}, el estado que menos votó fue {estado}, con {pct}. El que más, {otro}, con {pct_otro}: {diferencia} de diferencia.",
    },
    {
        "id": "comparar", "tipo": "comparar", "requiere": ["estado", "otro"], "usa": ["anio"],
        "sugerencia": "Compara Nuevo León y Coahuila",
        "ejemplos": ["compara jalisco y sonora", "quien vota mas nuevo leon o coahuila", "diferencia entre puebla y tlaxcala",
                     "jalisco contra guanajuato", "comparar oaxaca con chiapas", "vota mas yucatan que campeche",
                     "compara mi estado con otro"],
        "respuesta": "En {anio}, en {estado} votó el {pct} y en {otro} el {pct_otro}: {comparacion}.",
    },
    {
        "id": "edad", "tipo": "edad", "usa": ["estado", "anio"],
        "sugerencia": "¿Cómo vota cada edad?",
        "ejemplos": ["cuanto votan los jovenes", "participacion por edad", "votan los mayores", "que edad vota mas",
                     "como votan los de 18 a 24", "cuanto votan los adultos mayores", "que edad vota menos",
                     "participacion de jovenes en jalisco", "votan mas los jovenes o los viejos", "por grupo de edad"],
        "respuesta": "Por edad, {lugar_texto} en {anio}: {lista}. Votó más el grupo de {grupo_max} ({pct_max}) y menos el de {grupo_min} ({pct_min}).",
    },
    {
        "id": "sexo", "tipo": "sexo", "usa": ["estado", "anio"],
        "sugerencia": "¿Votan más las mujeres o los hombres?",
        "ejemplos": ["votan mas las mujeres o los hombres", "cuantas mujeres votaron", "participacion de mujeres",
                     "cuanto votan los hombres", "diferencia entre hombres y mujeres", "mujeres contra hombres",
                     "quien vota mas mujeres u hombres", "por sexo", "como votan las mujeres en chiapas"],
        "respuesta": "{lugar_texto} en {anio} votó el {mujeres} de las mujeres y el {hombres} de los hombres: {comparacion}.",
    },
    {
        "id": "seccion", "tipo": "seccion", "usa": ["estado", "anio"],
        "sugerencia": "¿Se vota más en el campo o en la ciudad?",
        "ejemplos": ["se vota mas en el campo o en la ciudad", "participacion rural", "como votan en las ciudades",
                     "urbano contra rural", "votan mas en los pueblos", "secciones rurales", "tipo de seccion",
                     "cuanto votan en el campo", "participacion urbana"],
        "respuesta": "{lugar_texto} en {anio}, por tipo de sección: urbana {urbana}, mixta {mixta} y rural {rural}.",
    },
    {
        "id": "historia", "tipo": "historia", "usa": ["estado"],
        "sugerencia": "¿Cómo ha cambiado la participación?",
        "ejemplos": ["como ha cambiado la participacion", "participacion en todas las elecciones", "historia de la participacion",
                     "ha subido o bajado la participacion", "evolucion de la participacion", "cada eleccion desde 2009",
                     "como ha votado jalisco en los ultimos anos", "tendencia de participacion"],
        "respuesta": "Participación {lugar_texto} en cada elección federal: {lista}.",
    },
    {
        "id": "tipos", "tipo": "tipos",
        "sugerencia": "¿Se vota menos en las intermedias?",
        "ejemplos": ["presidencial contra intermedia", "que es una eleccion intermedia", "se vota menos en las intermedias",
                     "diferencia entre eleccion presidencial e intermedia", "cuando hay eleccion de presidente",
                     "votan mas en las presidenciales"],
        "respuesta": "En las elecciones presidenciales se elige presidencia, Senado y diputaciones; en las intermedias, solo diputaciones federales. Presidenciales: {presidenciales}. Intermedias: {intermedias}.",
    },
    {
        "id": "regiones", "tipo": "region", "usa": ["anio"],
        "sugerencia": "¿Qué región vota más?",
        "ejemplos": ["que region vota mas", "participacion por region", "como vota el norte", "como vota el sur",
                     "regiones del pais", "el centro vota mas", "norte contra sur"],
        "respuesta": "Por región en {anio} (agrupación geográfica del equipo, no las circunscripciones): {lista}.",
    },
    {
        "id": "proxima", "tipo": "proxima",
        "sugerencia": "¿Cuándo es la próxima elección?",
        "ejemplos": ["cuando es la proxima eleccion", "cuando vuelvo a votar", "proxima eleccion federal",
                     "cuando son las siguientes elecciones", "cuando hay elecciones", "cuando puedo votar"],
        "respuesta": "La próxima elección federal es en {fecha} y es {tipo}: se eligen diputaciones federales.",
    },
    {
        "id": "ccpc", "tipo": "fijo",
        "sugerencia": "¿De dónde salen los datos?",
        "ejemplos": ["de donde salen los datos", "que es la ccpc", "que son los conteos censales", "cual es la fuente",
                     "quien hizo los datos", "son datos oficiales", "de donde sacan la informacion"],
        "respuesta": "De los Conteos Censales de Participación Ciudadana (CCPC) del INE: después de cada elección federal, el INE cuenta en los cuadernillos de la lista nominal quién votó, por edad, sexo y tipo de sección. Son datos abiertos y agregados, sin datos de ninguna persona.",
    },
    {
        "id": "metodo", "tipo": "metodo",
        "sugerencia": "¿Cómo se calcula?",
        "ejemplos": ["como se calcula", "como calculan la participacion", "que significa participacion",
                     "por que no coincide con los resultados oficiales", "metodologia", "formula de participacion"],
        "respuesta": "{metodo}",
    },
    {
        "id": "privacidad", "tipo": "fijo",
        "ejemplos": ["guardan mis datos", "guardas lo que escribo", "es privado", "mandan mi informacion",
                     "que hacen con mis preguntas", "me espian", "privacidad"],
        "respuesta": "No. Lo que escribes solo vive en esta página mientras la tienes abierta: no se guarda ni se envía a ningún servidor. Yo respondo aquí mismo, en tu dispositivo.",
    },
    {
        "id": "como_jugar", "tipo": "fijo",
        "ejemplos": ["como se juega", "como juego", "instrucciones", "de que trata el juego", "quiero jugar",
                     "como funciona el juego", "reglas del juego"],
        "respuesta": "Son 8 frases sobre quién vota en México. Marcas si cada una es cierta o falsa y te muestro el dato real con una gráfica. Al final ves tu resultado y puedes retar a otras personas. Vuelve al inicio y toca «Jugar».",
    },
    {
        "id": "fuera_alcance", "tipo": "fijo",
        "ejemplos": ["donde voto", "donde me toca votar", "como saco mi credencial", "donde esta mi casilla",
                     "tramite de credencial para votar", "renovar mi ine", "como me registro para votar", "mi credencial vencio"],
        "respuesta": "Eso no lo sé responder desde aquí. Para tu casilla, tu credencial o trámites, consulta el sitio del INE (ine.mx) o llama a INETEL al 800 433 2000.",
    },
    {
        "id": "opinion", "tipo": "fijo",
        "ejemplos": ["por quien voto", "quien va a ganar", "que partido es mejor", "por quien votas tu",
                     "cual candidato me recomiendas", "que opinas del gobierno", "a quien le vas"],
        "respuesta": "No hablo de partidos, candidaturas ni de por quién votar. Solo cuento qué tanto participa la gente, con datos del INE.",
    },
    {
        "id": "gracias", "tipo": "fijo",
        "ejemplos": ["gracias", "muchas gracias", "adios", "hasta luego", "bye", "nos vemos", "ok gracias"],
        "respuesta": "¡De nada! Y recuerda: que tu primer voto no sea el último.",
    },
]

# Paráfrasis de cada mito, además de su enunciado (que sale de mitos.json).
EJEMPLOS_MITOS = {
    "sexo": ["los hombres votan mas", "es cierto que los hombres votan mas que las mujeres", "votan menos las mujeres"],
    "campo": ["en el campo se vota menos", "en el campo se vota menos que en la ciudad", "es cierto que en el campo votan menos"],
    "intermedias": ["en las intermedias vota menos gente", "es cierto que en las intermedias se vota menos"],
    "primer-voto": ["a los 18 se vota menos", "los de 18 votan menos que el promedio", "el primer voto es bajo",
                    "es cierto que a los 18 anos se vota poco"],
    "jovenes": ["los jovenes no votan", "es cierto que los jovenes no votan", "a los jovenes no les importa votar",
                "los chavos no votan"],
    "sesentas": ["los de 60 votan mas", "las personas de 60 a 69 son las que mas votan", "es cierto que los de sesenta votan mas"],
    "mayores": ["los de 85 votan menos", "las personas muy mayores votan menos", "es cierto que los de 85 o mas votan menos"],
    "tendencia": ["la participacion en intermedias va bajando", "cada vez se vota menos en las intermedias",
                  "la participacion ha ido bajando desde 2009"],
}
PLANTILLA_MITO = "{veredicto}. {resumen}"

# Palabras con el mismo sentido para el motor (se comparan sin acentos y en minúsculas).
SINONIMOS = {
    "votar": ["voto", "voto", "votan", "votaron", "vota", "votamos", "votas", "votado", "votantes", "votante",
              "sufragio", "sufragan", "votacion", "votaciones", "participacion", "participan", "participo",
              "participaron", "participar", "participativo", "acudieron", "acude", "fueron", "fue", "van", "ir"],
    "joven": ["jovenes", "chavos", "chavas", "muchachos", "muchachas", "juventud", "chamacos", "morros"],
    "mayor": ["mayores", "viejos", "viejitos", "abuelos", "abuelitos", "ancianos", "tercera"],
    "mujer": ["mujeres", "senoras", "damas", "femenino"],
    "hombre": ["hombres", "senores", "varones", "masculino"],
    "rural": ["campo", "rurales", "rancho", "ranchos", "pueblo", "pueblos", "comunidades"],
    "urbano": ["ciudad", "ciudades", "urbana", "urbanas", "urbanos"],
    "pais": ["nacional", "mexico", "republica", "nacion", "mexicanos"],
    "mas": ["mejor"],
    "menos": ["peor", "minimo", "menor"],
    "eleccion": ["elecciones", "comicios", "jornada"],
    "comparar": ["compara", "comparame", "comparacion", "contra", "vs", "versus", "diferencia"],
    "ano": ["anos", "anios"],
}

# Palabras que no aportan al comparar. «mas», «menos», «como», «donde», «cuando» y «quien» sí aportan.
VACIAS = ("a al algo ante con de del el ella ellos en entre era es esa ese eso esta este esto fue ha han hay la las le les lo los "
          "me mi mis muy nos o para pero por que se si sin son su sus te tu tus u un una uno unos unas y ya yo cual cuales "
          "cuanto cuanta cuantos cuantas tan tanto tanta les oye dime sabes quisiera saber podrias puedes decirme gente personas "
          "realmente verdad entonces bueno pues todo toda todos todas").split()

# Alias de cada estado (además de su nombre en atlas.json). Los cortos solo se aceptan escritos tal cual.
ALIAS_ESTADOS = {
    2: ["baja california norte", "bc"], 3: ["bcs"], 5: ["coahuila de zaragoza"], 7: [], 8: [],
    9: ["cdmx", "df", "distrito federal", "ciudad de mexico", "la capital"], 15: ["edomex", "edo mex", "estado de mexico", "edo de mexico"],
    16: ["michoacan de ocampo"], 19: ["nl", "nuevo leon"], 22: ["queretaro de arteaga"], 23: ["qroo", "q roo"],
    24: ["slp"], 30: ["veracruz de ignacio de la llave"],
}

SUGERENCIAS_INICIO = ["estado_mas", "edad", "mito:jovenes"]


def normal(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def main() -> None:
    atlas = json.loads((DATOS / "atlas.json").read_text(encoding="utf-8"))
    mitos = json.loads((DATOS / "mitos.json").read_text(encoding="utf-8"))
    lista_mitos = [m for n in mitos["niveles"] for m in n["mitos"]]

    intenciones = [dict(i) for i in INTENCIONES]
    ids_mitos = {m["id"] for m in lista_mitos}
    exigir(set(EJEMPLOS_MITOS) == ids_mitos,
           f"Los mitos con ejemplos ({sorted(EJEMPLOS_MITOS)}) no coinciden con mitos.json ({sorted(ids_mitos)}).")
    for m in lista_mitos:
        intenciones.append({
            "id": f"mito:{m['id']}", "tipo": "mito", "mito": m["id"],
            "sugerencia": "¿" + m["enunciado"].rstrip(".") + "?",
            "ejemplos": [normal(m["enunciado"]), *EJEMPLOS_MITOS[m["id"]]],
            "respuesta": PLANTILLA_MITO,
        })

    vistos = set()
    for i in intenciones:
        exigir(i["id"] not in vistos, f"Intención repetida: {i['id']}.")
        vistos.add(i["id"])
        exigir(i["tipo"] in DATOS_POR_TIPO, f"{i['id']}: tipo desconocido «{i['tipo']}».")
        exigir(len(i["ejemplos"]) >= 3, f"{i['id']}: necesita al menos 3 preguntas de ejemplo.")
        usados = set(re.findall(r"\{(\w+)\}", i["respuesta"]))
        sobran = usados - DATOS_POR_TIPO[i["tipo"]]
        exigir(not sobran, f"{i['id']}: la plantilla usa {sorted(sobran)}, que el tipo «{i['tipo']}» no tiene.")
    for s in SUGERENCIAS_INICIO:
        exigir(s in vistos, f"Sugerencia inicial desconocida: {s}.")

    claves = {e["clave"] for e in atlas["estados"]}
    alias = {}
    for e in atlas["estados"]:
        for a in [e["nombre"], *ALIAS_ESTADOS.get(e["clave"], [])]:
            a = normal(a)
            exigir(alias.get(a, e["clave"]) == e["clave"], f"El alias «{a}» se repite en dos estados.")
            alias[a] = e["clave"]
    exigir(set(ALIAS_ESTADOS) <= claves, "ALIAS_ESTADOS tiene claves que no existen.")

    sinonimos = {}
    for forma, palabras in SINONIMOS.items():
        for p in palabras:
            sinonimos[normal(p)] = forma

    chat = {
        "intenciones": intenciones,
        "sinonimos": sinonimos,
        "vacias": sorted(set(VACIAS)),
        "alias_estados": alias,
        "sugerencias_inicio": SUGERENCIAS_INICIO,
    }
    (DATOS / "chat.json").write_text(json.dumps(chat, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"chat.json: {len(intenciones)} intenciones, {sum(len(i['ejemplos']) for i in intenciones)} ejemplos, "
          f"{len(alias)} alias de estados")


if __name__ == "__main__":
    main()
