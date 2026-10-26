"""
Procesa los Conteos Censales de Participación Ciudadana (CCPC) 2009-2024 del INE
y genera archivos JSON pequeños para el juego "Mitos vs. Datos".

Uso:
    python scripts/procesar.py               # usa el agregado en caché si existe
    python scripts/procesar.py --rehacer     # vuelve a leer los ZIP crudos
    python scripts/procesar.py --entidad 6   # juego con datos de un solo estado (6 = Colima)

Entradas (data/raw/):  ccpc_2009.zip, ccpc_2012.zip, ..., ccpc_2024.zip
Salidas:
    data/processed/conteos_agregados.csv  (entidad x tipo de sección x sexo x edad)
    data/processed/municipios.csv         (con --rehacer: participación total por municipio y año)
    data/processed/evidencia_mitos.json   (cifras usadas para evaluar cada mito)
    site/data/*.json                      (datos que consume el sitio)
    site/data/entidad/<clave>/mitos.json  (con --entidad: el juego de ese estado)
    site/data/entidad/<clave>/personal.json  (datos locales para personalizar; 0 = el país)
    site/data/entidad/<clave>/municipios.json  (participación por municipio, si hay agregado municipal)

Definición de participación (igual que la plataforma CCPC):
    participación = SV / (SV + NV)
Los registros NS (no especificados) se excluyen del cálculo.
"""

import argparse
import json
import zipfile
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
RAW = RAIZ / "data" / "raw"
PROCESADOS = RAIZ / "data" / "processed"
SITIO_DATOS = RAIZ / "site" / "data"
AGREGADO = PROCESADOS / "conteos_agregados.csv"
MUNICIPIOS = PROCESADOS / "municipios.csv"

ANIOS = [2009, 2012, 2015, 2018, 2021, 2024]
PRESIDENCIALES = {2012, 2018, 2024}

ENTIDADES = {
    1: "Aguascalientes", 2: "Baja California", 3: "Baja California Sur",
    4: "Campeche", 5: "Coahuila", 6: "Colima", 7: "Chiapas", 8: "Chihuahua",
    9: "Ciudad de México", 10: "Durango", 11: "Guanajuato", 12: "Guerrero",
    13: "Hidalgo", 14: "Jalisco", 15: "Estado de México", 16: "Michoacán",
    17: "Morelos", 18: "Nayarit", 19: "Nuevo León", 20: "Oaxaca", 21: "Puebla",
    22: "Querétaro", 23: "Quintana Roo", 24: "San Luis Potosí", 25: "Sinaloa",
    26: "Sonora", 27: "Tabasco", 28: "Tamaulipas", 29: "Tlaxcala",
    30: "Veracruz", 31: "Yucatán", 32: "Zacatecas",
}

TIPOS_SECCION = {"U": "Urbana", "M": "Mixta", "R": "Rural"}

# Grupos quinquenales y etapas de vida tal como los define el manual de la CCPC.
GRUPOS = ["18-19"] + [f"{i}-{i + 4}" for i in range(20, 100, 5)] + ["100+"]
# Para el sitio se agrupan las edades de 85 años o más: son grupos pequeños y ruidosos.
GRUPOS_85 = GRUPOS[:14] + ["85+"]
ETAPAS = [
    ("Juventud (18-24)", 18, 24),
    ("Adulta joven (25-34)", 25, 34),
    ("Adulta (35-44)", 35, 44),
    ("Adulta plena (45-59)", 45, 59),
    ("Adulta mayor (60+)", 60, 200),
]

# Archivos que consume el sitio (site/data/).
PUBLICAR = ["mitos", "explora", "entidades"]

# Próxima elección federal: el único lugar donde se configura. La fecha exacta la fija el INE;
# mientras no se confirme se usa solo el mes.
PROXIMA_ELECCION = {"anio": 2027, "fecha": "junio de 2027", "tipo": "intermedia", "cada_cuantos_anios": 3}

# Celdas pequeñas: si una combinación (estado x edad x año, etc.) tiene menos personas en la
# lista nominal que este umbral, no se publica su participación y el sitio usa un grupo más amplio.
UMBRAL_LISTA_NOMINAL = 1000

# Diferencia en puntos por debajo de la cual dos participaciones se tratan como empate.
EMPATE_PUNTOS = 1.0

# Edades simples del final personalizado: 18 a 84 y el grupo de 85 años o más.
EDADES_PERSONAL = list(range(18, 85))

COLUMNAS = ["EDOCVE", "TIPOSEC", "SEXO", "EDAD", "LN", "SV", "NV", "NS"]
LLAVES = ["AELEC", "EDOCVE", "TIPOSEC", "SEXO", "EDAD"]
CONTEOS = ["LN", "SV", "NV", "NS"]


def grupo_quinquenal(edad: int) -> str:
    if edad < 20:
        return "18-19"
    if edad >= 100:
        return "100+"
    inicio = edad - edad % 5
    return f"{inicio}-{inicio + 4}"


def grupo_85(grupo: str) -> str:
    return grupo if grupo in GRUPOS_85 else "85+"


def etiqueta_grupo(grupo: str) -> str:
    return "85 y más" if grupo == "85+" else grupo.replace("-", "–")


def etapa_de_vida(edad: int) -> str:
    for nombre, desde, hasta in ETAPAS:
        if desde <= edad <= hasta:
            return nombre
    raise ValueError(edad)


def leer_anio(anio: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Lee todos los CSV estatales de un año. Devuelve el agregado por las LLAVES y el total por municipio.
    Los nombres de municipio se toman solo del año más reciente (los archivos viejos traen otra codificación)."""
    ruta = RAW / f"ccpc_{anio}.zip"
    con_nombre = anio == ANIOS[-1]
    columnas = COLUMNAS + ["MPIOCVE"] + (["MPIONOM"] if con_nombre else [])
    partes, municipales = [], []
    with zipfile.ZipFile(ruta) as zf:
        for nombre in sorted(n for n in zf.namelist() if n.lower().endswith(".csv")):
            with zf.open(nombre) as f:
                df = pd.read_csv(
                    f,
                    usecols=columnas,
                    dtype={"TIPOSEC": "string", "MPIONOM": "string"},
                    encoding="utf-8-sig",
                    encoding_errors="replace",
                )
            df["TIPOSEC"] = df["TIPOSEC"].str.strip().str.upper().str[0]
            partes.append(df.groupby(COLUMNAS[:4], dropna=False)[CONTEOS].sum().reset_index())
            llaves_m = ["EDOCVE", "MPIOCVE"] + (["MPIONOM"] if con_nombre else [])
            municipales.append(df.groupby(llaves_m, dropna=False)[CONTEOS].sum().reset_index())
            print(f"  {anio} {nombre.split('/')[-1]}: {len(df):,} filas")
    agregado = pd.concat(partes, ignore_index=True)
    agregado.insert(0, "AELEC", anio)
    municipal = pd.concat(municipales, ignore_index=True)
    municipal.insert(0, "AELEC", anio)
    return agregado, municipal


def cargar(rehacer: bool) -> pd.DataFrame:
    if AGREGADO.exists() and not rehacer:
        print(f"Usando agregado en caché: {AGREGADO.relative_to(RAIZ)}")
        return pd.read_csv(AGREGADO, dtype={"TIPOSEC": "string"})
    faltantes = [a for a in ANIOS if not (RAW / f"ccpc_{a}.zip").exists()]
    if faltantes:
        raise SystemExit(
            f"Faltan los archivos {faltantes} en data/raw/. Consulta el README para descargarlos."
        )
    leidos = [leer_anio(a) for a in ANIOS]
    df = pd.concat([x[0] for x in leidos], ignore_index=True)
    df = df.groupby(LLAVES, dropna=False)[CONTEOS].sum().reset_index()
    PROCESADOS.mkdir(parents=True, exist_ok=True)
    df.to_csv(AGREGADO, index=False)
    print(f"Guardado {AGREGADO.relative_to(RAIZ)} ({len(df):,} filas)")

    # Municipios: nombres del año más reciente para todos los años.
    mun = pd.concat([x[1] for x in leidos], ignore_index=True)
    nombres = mun.dropna(subset=["MPIONOM"]).groupby(["EDOCVE", "MPIOCVE"])["MPIONOM"].first()
    mun = mun.groupby(["AELEC", "EDOCVE", "MPIOCVE"])[CONTEOS].sum().reset_index()
    mun["MPIONOM"] = [nombres.get((e, m)) for e, m in zip(mun["EDOCVE"], mun["MPIOCVE"])]
    mun.to_csv(MUNICIPIOS, index=False)
    print(f"Guardado {MUNICIPIOS.relative_to(RAIZ)} ({len(mun):,} filas)")
    return df


# ---------------------------------------------------------------- cálculos

def participacion(df: pd.DataFrame, por: list[str]) -> pd.DataFrame:
    """Suma conteos por `por` y calcula la participación en porcentaje."""
    g = df.groupby(por, dropna=False)[CONTEOS].sum().reset_index()
    g["PART"] = 100 * g["SV"] / (g["SV"] + g["NV"])
    return g


def r1(x: float) -> float:
    return round(float(x), 1)


def preparar(df: pd.DataFrame) -> pd.DataFrame:
    df = df[df["EDAD"] >= 18].copy()
    df["GRUPO"] = df["EDAD"].map(grupo_quinquenal)
    df["ETAPA"] = df["EDAD"].map(etapa_de_vida)
    df["GRUPO85"] = df["GRUPO"].map(grupo_85)
    return df


def serie_por(df: pd.DataFrame, columna: str, orden: list) -> dict:
    """{año: [participación por cada valor de `orden`]}"""
    g = participacion(df, ["AELEC", columna])
    salida = {}
    for anio in ANIOS:
        sub = g[g["AELEC"] == anio].set_index(columna)["PART"]
        salida[str(anio)] = [r1(sub[v]) if v in sub.index else None for v in orden]
    return salida


def estadisticas(df: pd.DataFrame) -> dict:
    """Participación por año, edad, sexo y tipo de sección. Sirve para el país o para un estado."""
    nac = participacion(df, ["AELEC"]).set_index("AELEC")
    nacional = {
        "anios": ANIOS,
        "tipo": ["Presidencial" if a in PRESIDENCIALES else "Intermedia" for a in ANIOS],
        "participacion": [r1(nac.loc[a, "PART"]) for a in ANIOS],
        "lista_nominal": [int(nac.loc[a, "LN"]) for a in ANIOS],
        "votaron": [int(nac.loc[a, "SV"]) for a in ANIOS],
        "no_especificados_pct": [r1(100 * nac.loc[a, "NS"] / nac.loc[a, "LN"]) for a in ANIOS],
    }

    edades = list(range(18, 100))
    edad = {
        "anios": ANIOS,
        "edades": edades,
        "por_edad": serie_por(df[df["EDAD"] < 100], "EDAD", edades),
        "grupos": GRUPOS,
        "por_grupo": serie_por(df, "GRUPO", GRUPOS),
        "etapas": [e[0] for e in ETAPAS],
        "por_etapa": serie_por(df, "ETAPA", [e[0] for e in ETAPAS]),
    }

    binario = df[df["SEXO"].isin([0, 1])]
    sexo = {
        "anios": ANIOS,
        "nota": "En 2024 se registró la opción No binario; se excluye de esta comparación.",
        "total": {"Hombres": [], "Mujeres": []},
        "grupos": GRUPOS,
        "por_grupo": {},
    }
    g_sexo = participacion(binario, ["AELEC", "SEXO"]).set_index(["AELEC", "SEXO"])["PART"]
    for anio in ANIOS:
        sexo["total"]["Hombres"].append(r1(g_sexo[(anio, 0)]))
        sexo["total"]["Mujeres"].append(r1(g_sexo[(anio, 1)]))
    g_sg = participacion(binario, ["AELEC", "SEXO", "GRUPO"]).set_index(["AELEC", "SEXO", "GRUPO"])["PART"]
    for anio in ANIOS:
        sexo["por_grupo"][str(anio)] = {
            "Hombres": [r1(g_sg[(anio, 0, g)]) for g in GRUPOS],
            "Mujeres": [r1(g_sg[(anio, 1, g)]) for g in GRUPOS],
        }

    g_tipo = participacion(df, ["AELEC", "TIPOSEC"]).set_index(["AELEC", "TIPOSEC"])
    tipo_seccion = {
        "anios": ANIOS,
        "tipos": list(TIPOS_SECCION.values()),
        "participacion": {
            n: [r1(g_tipo.loc[(a, c), "PART"]) for a in ANIOS] for c, n in TIPOS_SECCION.items()
        },
        "lista_nominal_pct": {
            n: [r1(100 * g_tipo.loc[(a, c), "LN"] / nac.loc[a, "LN"]) for a in ANIOS]
            for c, n in TIPOS_SECCION.items()
        },
    }
    return {"nacional": nacional, "edad": edad, "sexo": sexo, "tipo_seccion": tipo_seccion}


def construir_salidas(df: pd.DataFrame) -> tuple[dict, dict]:
    s = estadisticas(df)
    nacional = s["nacional"]

    g_ent = participacion(df, ["AELEC", "EDOCVE"]).set_index(["AELEC", "EDOCVE"])["PART"]
    entidades = {
        "anios": ANIOS,
        "entidades": [{"clave": c, "nombre": n} for c, n in ENTIDADES.items()],
        "participacion": {str(a): [r1(g_ent[(a, c)]) for c in ENTIDADES] for a in ANIOS},
        "nacional": {str(a): nacional["participacion"][i] for i, a in enumerate(ANIOS)},
    }

    # Explora los datos: participación por grupo de edad, año y entidad (0 = nacional).
    g_eg = participacion(df, ["AELEC", "EDOCVE", "GRUPO85"]).set_index(["AELEC", "EDOCVE", "GRUPO85"])["PART"]
    g_ng = participacion(df, ["AELEC", "GRUPO85"]).set_index(["AELEC", "GRUPO85"])["PART"]
    explora = {
        "anios": ANIOS,
        "grupos": [etiqueta_grupo(g) for g in GRUPOS_85],
        "entidades": entidades["entidades"],
        "datos": {},
    }
    for anio in ANIOS:
        explora["datos"][str(anio)] = {"0": [r1(g_ng[(anio, g)]) for g in GRUPOS_85]}
        for c in ENTIDADES:
            explora["datos"][str(anio)][str(c)] = [
                r1(g_eg[(anio, c, g)]) if (anio, c, g) in g_eg.index else None for g in GRUPOS_85
            ]

    # El final personalizado usa el año más reciente: no puede faltar ninguna combinación.
    ultimo = explora["datos"][str(ANIOS[-1])]
    if any(v is None for valores in ultimo.values() for v in valores):
        raise SystemExit(f"Faltan datos de {ANIOS[-1]} por entidad y grupo de edad para el final personalizado.")

    salidas = {**s, "entidades": entidades, "explora": explora}
    ev = evidencia(df, salidas)
    salidas["mitos"] = construir_mitos(df, salidas, ev)
    return salidas, ev


def evidencia(df: pd.DataFrame, s: dict) -> dict:
    """Cifras concretas para evaluar cada mito candidato.
    Las comparaciones entre estados solo se calculan cuando hay datos de todo el país."""
    todo_el_pais = "entidades" in s
    nac = dict(zip(ANIOS, s["nacional"]["participacion"]))
    jov = participacion(df[df["EDAD"] <= 29], ["AELEC"]).set_index("AELEC")["PART"]
    resto = participacion(df[df["EDAD"] >= 30], ["AELEC"]).set_index("AELEC")["PART"]
    por_edad = s["edad"]["por_edad"]
    por_grupo = s["edad"]["por_grupo"]

    ev = {"nacional": nac}
    ev["m1_jovenes"] = {
        str(a): {"18_29": r1(jov[a]), "30_mas": r1(resto[a]), "nacional": nac[a]} for a in ANIOS
    }
    ev["m2_primer_voto"] = {
        str(a): {
            "18": por_edad[str(a)][0],
            "minimo_18_29": min(por_edad[str(a)][:12]),
            "edad_minimo_18_29": 18 + por_edad[str(a)][:12].index(min(por_edad[str(a)][:12])),
            "30": por_edad[str(a)][12],
        }
        for a in ANIOS
    }
    ev["m3_sexo"] = {
        str(a): {
            "hombres": s["sexo"]["total"]["Hombres"][i],
            "mujeres": s["sexo"]["total"]["Mujeres"][i],
            "grupos_donde_hombres_votan_mas": [
                g for g, h, m in zip(GRUPOS, s["sexo"]["por_grupo"][str(a)]["Hombres"],
                                     s["sexo"]["por_grupo"][str(a)]["Mujeres"]) if h > m
            ],
        }
        for i, a in enumerate(ANIOS)
    }
    ev["m4_intermedias"] = {
        "presidenciales": {str(a): nac[a] for a in ANIOS if a in PRESIDENCIALES},
        "intermedias": {str(a): nac[a] for a in ANIOS if a not in PRESIDENCIALES},
    }
    ev["m5_tipo_seccion"] = {
        str(a): {t: s["tipo_seccion"]["participacion"][t][i] for t in s["tipo_seccion"]["tipos"]}
        for i, a in enumerate(ANIOS)
    }
    ev["m6_tendencia"] = nac
    ev["m7_estados"] = {}
    for a in (ANIOS if todo_el_pais else []):
        vals = dict(zip(ENTIDADES.values(), s["entidades"]["participacion"][str(a)]))
        alto = max(vals, key=vals.get)
        bajo = min(vals, key=vals.get)
        ev["m7_estados"][str(a)] = {
            "max": [alto, vals[alto]], "min": [bajo, vals[bajo]],
            "brecha": r1(vals[alto] - vals[bajo]),
        }
    ev["m8_mayores"] = {
        str(a): {
            "grupo_mas_bajo": GRUPOS[por_grupo[str(a)].index(min(por_grupo[str(a)]))],
            "valor_mas_bajo": min(por_grupo[str(a)]),
            "grupo_mas_alto": GRUPOS[por_grupo[str(a)].index(max(por_grupo[str(a)]))],
            "valor_mas_alto": max(por_grupo[str(a)]),
            "por_grupo": dict(zip(GRUPOS, por_grupo[str(a)])),
        }
        for a in ANIOS
    }

    # --- Robustez y cifras complementarias
    lista = df.groupby("AELEC")["LN"].sum()
    ev["votantes_millones"] = {str(a): round(int(s["nacional"]["votaron"][i]) / 1e6, 1)
                               for i, a in enumerate(ANIOS)}
    jov_abs = df[df["EDAD"] <= 29].groupby("AELEC")[["SV", "LN"]].sum()
    ev["jovenes_18_29"] = {
        str(a): {"votaron_millones": round(jov_abs.loc[a, "SV"] / 1e6, 1),
                 "pct_lista_nominal": r1(100 * jov_abs.loc[a, "LN"] / lista[a])}
        for a in ANIOS
    }
    ev["edad_18_vs_nacional"] = {str(a): [por_edad[str(a)][0], nac[a]] for a in ANIOS}
    ev["pct_lista_85_mas"] = {
        str(a): r1(100 * df[(df["AELEC"] == a) & (df["EDAD"] >= 85)]["LN"].sum() / lista[a])
        for a in ANIOS
    }
    t = df.groupby(["AELEC", "TIPOSEC"])[["SV", "NS", "LN"]].sum()
    ev["tipo_seccion_robustez"] = {
        str(a): {
            TIPOS_SECCION[c]: {
                "sv_entre_ln": r1(100 * t.loc[(a, c), "SV"] / t.loc[(a, c), "LN"]),
                "ns_pct": r1(100 * t.loc[(a, c), "NS"] / t.loc[(a, c), "LN"]),
            }
            for c in TIPOS_SECCION
        }
        for a in ANIOS
    }
    if todo_el_pais:
        te = participacion(df, ["AELEC", "EDOCVE", "TIPOSEC"]).pivot_table(
            index=["AELEC", "EDOCVE"], columns="TIPOSEC", values="PART")
        ev["estados_con_rural_mayor_que_urbana"] = {
            str(a): int((te.loc[a, "R"] > te.loc[a, "U"]).sum()) for a in ANIOS
        }
        e = participacion(df, ["AELEC", "EDOCVE"])
        e["LUGAR"] = e.groupby("AELEC")["PART"].rank(ascending=False).astype(int)
        lugares = e.pivot(index="EDOCVE", columns="AELEC", values="LUGAR")
        ev["lugar_por_estado"] = {
            ENTIDADES[c]: {str(a): int(lugares.loc[c, a]) for a in ANIOS} for c in ENTIDADES
        }
    ev["brecha_mujeres_menos_hombres_por_grupo"] = {
        str(a): {
            g: r1(m - h) for g, h, m in zip(GRUPOS, s["sexo"]["por_grupo"][str(a)]["Hombres"],
                                            s["sexo"]["por_grupo"][str(a)]["Mujeres"])
        }
        for a in ANIOS
    }
    return ev


# ---------------------------------------------------------------- mitos del juego

# Preguntas para conversar en el modo salón. No llevan cifras: invitan a pensar en las causas.
DISCUSION = {
    "sexo": "¿Por qué creen que mucha gente piensa que los hombres votan más? ¿Qué podría explicar que las mujeres voten más?",
    "campo": "¿Qué facilita o dificulta ir a votar en una comunidad rural? ¿Y en una ciudad grande?",
    "intermedias": "¿Sabían qué se elige en una elección intermedia? ¿Por qué creen que llama menos la atención?",
    "primer-voto": "¿Qué recuerdan o imaginan de su primer voto? ¿Por qué creen que a los 18 años se vota más?",
    "jovenes": "¿Qué hace que una persona joven deje de votar después de su primer voto? ¿Qué le ayudaría a seguir votando?",
    "sesentas": "¿Qué costumbres o experiencias pueden hacer que alguien vote toda su vida?",
    "mayores": "¿Qué obstáculos puede tener una persona de 85 años o más para ir a votar? ¿Cómo se le podría ayudar?",
    "tendencia": "Si la participación en las intermedias puede subir, ¿qué podrían hacer ustedes para que siga subiendo?",
}

def fuente(anios: str) -> str:
    return f"Fuente: INE, Conteos Censales de Participación Ciudadana, {anios}."


def pct(x: float) -> str:
    return f"{x:.1f}%"


class MitoNoSostenido(Exception):
    """Los datos no sostienen el veredicto aprobado de un mito."""

    def __init__(self, mito: str, detalle: str = ""):
        super().__init__(f"Los datos ya no sostienen el veredicto del mito '{mito}'.")
        self.mito = mito
        self.detalle = detalle


def comprobar(condicion: bool, mito: str, detalle=None) -> None:
    """Avisa si los datos ya no sostienen el veredicto aprobado.
    `detalle` es una función que explica por qué, con cifras; solo se calcula si falla."""
    if not condicion:
        raise MitoNoSostenido(mito, detalle() if detalle else "")


def cantidad(personas: float) -> str:
    """11.9 millones, o 52 mil cuando no llega al millón."""
    if personas >= 1e6:
        return f"{personas / 1e6:.1f} millones"
    return f"{round(personas / 1e3):,} mil"


def cantidad_personas(personas: float) -> str:
    """«11.9 millones de personas» o «65 mil personas»."""
    texto = cantidad(personas)
    return f"{texto} de personas" if "millones" in texto else f"{texto} personas"


def construir_mitos(df: pd.DataFrame, s: dict, ev: dict, ambito: dict | None = None) -> dict:
    """Textos, veredictos y datos de gráfica de cada mito. Todas las cifras salen de los datos.

    Sin `ambito` se arma el juego nacional y cualquier mito que no se cumpla detiene el proceso.
    Con `ambito` ({"clave", "nombre"}) se arma el de un estado: el mito que no se cumpla ahí se omite
    y se explica en consola, en lugar de mostrar un veredicto falso.
    """
    nac = ev["nacional"]
    a = "2024"
    anios_txt = [str(x) for x in ANIOS]
    rango = f"{ANIOS[0]}–{ANIOS[-1]}"

    # Palabras que cambian entre el país y un estado.
    if ambito is None:
        lugar = "México"
        promedio = "promedio nacional"
        frente_a = "nacional"
        titulo_elecciones = f"Participación nacional por elección, {rango}"
    else:
        lugar = ambito["nombre"]
        promedio = f"promedio de {lugar}"
        frente_a = f"de {lugar}"
        titulo_elecciones = f"Participación en {lugar} por elección, {rango}"
    Promedio = promedio[0].upper() + promedio[1:]

    # Cifras que comparten varios mitos o el cierre.
    edades = s["edad"]["edades"]
    serie = s["edad"]["por_edad"][a]
    hasta = edades.index(40) + 1
    jovenes = serie[:12]
    minimo = min(jovenes)
    edad_min = edades[jovenes.index(minimo)]
    inter = {x: nac[x] for x in ANIOS if x not in PRESIDENCIALES}
    pres = {x: nac[x] for x in ANIOS if x in PRESIDENCIALES}

    # 1. Los jóvenes no votan. (Falso)
    def mito_jovenes() -> dict:
        j = ev["m1_jovenes"][a]
        votaron = df[(df["AELEC"] == 2024) & (df["EDAD"] <= 29)]["SV"].sum()
        min_jov = min(ev["m1_jovenes"][str(x)]["18_29"] for x in ANIOS)
        anio_min_jov = min(ANIOS, key=lambda x: ev["m1_jovenes"][str(x)]["18_29"])
        comprobar(min_jov >= 100 / 3, "jóvenes",
                  lambda: f"en {anio_min_jov} votó solo el {pct(min_jov)} de las personas de 18 a 29 años.")
        return {
            "id": "jovenes",
            "enunciado": "Los jóvenes no votan.",
            "veredicto": "falso",
            "dato": {"cifra": pct(j["18_29"]), "texto": "de las personas de 18 a 29 años votó en 2024."},
            "resumen": (
                f"Son {cantidad_personas(votaron)}. Votan menos que quienes tienen 30 años o más "
                f"({pct(j['30_mas'])}), pero sí votan."
            ),
            "explicacion": (
                f"En 2024 votó el {pct(j['18_29'])} de las personas de 18 a 29 años: {cantidad(votaron)}. "
                f"En ninguna elección desde 2009 votó menos de un tercio de ellas (el mínimo fue "
                f"{pct(min_jov)} en {anio_min_jov}). Sí votan menos que quienes tienen 30 años o más "
                f"({pct(j['30_mas'])} en 2024)."
            ),
            "grafica": {
                "tipo": "barras",
                "titulo": "Participación por edad, 2024",
                "items": [
                    {"etiqueta": "18 a 29 años", "valor": j["18_29"], "color": "datos"},
                    {"etiqueta": "30 años o más", "valor": j["30_mas"], "color": "base"},
                    {"etiqueta": Promedio, "valor": nac[2024], "color": "base"},
                ],
            },
            "fuente": fuente("2024"),
        }

    # 2. A los 18 años se vota menos que el promedio. (Falso)
    def mito_18() -> dict:
        comprobar(all(s["edad"]["por_edad"][str(x)][0] > nac[x] for x in ANIOS), "18 años",
                  lambda: "a los 18 años no se votó más que el promedio en " + ", ".join(
                      f"{x} ({pct(s['edad']['por_edad'][str(x)][0])} contra {pct(nac[x])})"
                      for x in ANIOS if s["edad"]["por_edad"][str(x)][0] <= nac[x]) + ".")
        return {
            "id": "primer-voto",
            "enunciado": f"A los 18 años se vota menos que el {promedio}.",
            "veredicto": "falso",
            "dato": {"cifra": pct(serie[0]), "texto": f"votó a los 18 años en 2024. El {promedio} fue de {pct(nac[2024])}."},
            "resumen": (
                f"A los 18 años se vota más que el {promedio}, y así fue en las 6 elecciones. "
                f"Después la participación baja hasta {pct(minimo)} a los {edad_min} años."
            ),
            "explicacion": (
                f"A los 18 años se vota más que el {promedio}, y así fue en las 6 "
                f"elecciones desde 2009. En 2024 votó el {pct(serie[0])} de quienes tenían 18 años, frente "
                f"al {pct(nac[2024])} {frente_a}. La participación baja después: llega a {pct(minimo)} a los "
                f"{edad_min} años y luego vuelve a subir."
            ),
            "grafica": {
                "tipo": "linea",
                "titulo": "Participación por edad, de 18 a 40 años, 2024",
                "x": [str(e) for e in edades[:hasta]],
                "x_titulo": "Edad",
                "series": [{"nombre": "2024", "valores": serie[:hasta], "color": "datos"}],
                "referencia": {"valor": nac[2024], "etiqueta": f"{Promedio}: {pct(nac[2024])}"},
                "marcas": [0, jovenes.index(minimo)],
            },
            "fuente": fuente("2024"),
        }

    # 3. Los hombres votan más que las mujeres. (Falso)
    def mito_sexo() -> dict:
        hom = s["sexo"]["total"]["Hombres"]
        muj = s["sexo"]["total"]["Mujeres"]
        comprobar(all(m > h for m, h in zip(muj, hom)), "sexo",
                  lambda: "los hombres votaron igual o más en " + ", ".join(
                      f"{x} ({pct(h)} contra {pct(m_)})" for x, h, m_ in zip(ANIOS, hom, muj) if m_ <= h) + ".")
        grupos_h = ev["m3_sexo"][a]["grupos_donde_hombres_votan_mas"]
        cierre_sexo = (f" Solo a partir de los {grupos_h[0].split('-')[0]} años los hombres votaron un poco más."
                       if grupos_h else "")
        no_binario = int(df[(df["AELEC"] == 2024) & (df["SEXO"] == 2)]["LN"].sum())
        registros = f" ({no_binario} registros)" if no_binario else ""
        return {
            "id": "sexo",
            "enunciado": "Los hombres votan más que las mujeres.",
            "veredicto": "falso",
            "dato": {"cifra": pct(muj[-1]), "texto": f"de las mujeres votó en 2024, contra {pct(hom[-1])} de los hombres."},
            "resumen": "Las mujeres votaron más que los hombres en las 6 elecciones desde 2009." + cierre_sexo,
            "explicacion": (
                "Las mujeres votaron más que los hombres en las 6 elecciones desde 2009. "
                f"En 2024 votó el {pct(muj[-1])} de las mujeres y el {pct(hom[-1])} de los hombres."
                + cierre_sexo
            ),
            "grafica": {
                "tipo": "columnas",
                "titulo": f"Participación por sexo, {rango}",
                "x": anios_txt,
                "series": [
                    {"nombre": "Mujeres", "valores": muj, "color": "datos"},
                    {"nombre": "Hombres", "valores": hom, "color": "base"},
                ],
                "nota": f"En 2024 se registró por primera vez la opción no binaria{registros}; no se incluye en esta comparación.",
            },
            "fuente": fuente(rango),
        }

    # 4. En las intermedias vota menos gente que en las presidenciales. (Cierto)
    def mito_intermedias() -> dict:
        max_inter = max(inter, key=inter.get)
        min_pres = min(pres, key=pres.get)
        comprobar(inter[max_inter] < pres[min_pres], "intermedias",
                  lambda: f"la intermedia de {max_inter} ({pct(inter[max_inter])}) superó a la presidencial "
                          f"de {min_pres} ({pct(pres[min_pres])}).")
        return {
            "id": "intermedias",
            "enunciado": "En las elecciones intermedias vota menos gente que en las presidenciales.",
            "veredicto": "cierto",
            "dato": {"cifra": pct(inter[max_inter]),
                     "texto": f"votó en la intermedia más alta ({max_inter}). La presidencial más baja tuvo {pct(pres[min_pres])} ({min_pres})."},
            "resumen": ("En las 3 intermedias votó menos gente que en cualquier presidencial. "
                        "En las intermedias se elige la Cámara de Diputados, pero no la Presidencia."),
            "explicacion": (
                "En las 3 intermedias votó menos gente que en cualquiera de las 3 presidenciales: "
                f"la intermedia con más participación ({max_inter}, {pct(inter[max_inter])}) quedó debajo de la "
                f"presidencial con menos ({min_pres}, {pct(pres[min_pres])}). En las intermedias se elige la "
                "Cámara de Diputados, pero no la Presidencia."
            ),
            "grafica": {
                "tipo": "columnas",
                "titulo": titulo_elecciones,
                "x": anios_txt,
                "series": [{
                    "nombre": "Participación",
                    "valores": [nac[x] for x in ANIOS],
                    "colores": ["datos" if x in PRESIDENCIALES else "base" for x in ANIOS],
                }],
                "leyenda": [{"nombre": "Presidencial", "color": "datos"}, {"nombre": "Intermedia", "color": "base"}],
            },
            "fuente": fuente(rango),
        }

    # 5. En el campo siempre se ha votado menos que en la ciudad. (Falso)
    def mito_campo() -> dict:
        tp = s["tipo_seccion"]["participacion"]
        rural, urbana = tp["Rural"], tp["Urbana"]
        rob = ev["tipo_seccion_robustez"]
        # Falso con cualquier método: hay elecciones donde lo rural supera a lo urbano también con SV/LN.
        comprobar(all(r >= u for r, u in zip(rural, urbana))
                  and any(rob[str(x)]["Rural"]["sv_entre_ln"] > rob[str(x)]["Urbana"]["sv_entre_ln"] for x in ANIOS),
                  "campo",
                  lambda: ("en las secciones rurales se votó menos que en las urbanas en " + ", ".join(
                      f"{x} ({pct(r)} contra {pct(u)})" for x, r, u in zip(ANIOS, rural, urbana) if r < u) + ".")
                  if any(r < u for r, u in zip(rural, urbana))
                  else "lo rural solo supera a lo urbano con un método de cálculo, no con ambos.")
        if abs(rural[5] - urbana[5]) < 1:
            ultimo = f"En 2024 quedaron prácticamente empatadas ({pct(rural[5])} y {pct(urbana[5])})."
        else:
            ultimo = f"En 2024 votó el {pct(rural[5])} en secciones rurales y el {pct(urbana[5])} en urbanas."
        return {
            "id": "campo",
            "enunciado": "En el campo siempre se ha votado menos que en la ciudad.",
            "veredicto": "falso",
            "dato": {"cifra": pct(rural[4]), "texto": f"votó en secciones rurales en 2021, contra {pct(urbana[4])} en urbanas."},
            "resumen": f"En las 6 elecciones el campo votó igual o más que la ciudad. {ultimo}",
            "explicacion": (
                "En todas las elecciones desde 2009 se votó igual o más en las secciones rurales "
                f"que en las urbanas. En 2021, por ejemplo, votó el {pct(rural[4])} en secciones rurales y el "
                f"{pct(urbana[4])} en urbanas. {ultimo}"
            ),
            "grafica": {
                "tipo": "columnas",
                "titulo": f"Participación por tipo de sección electoral, {rango}",
                "x": anios_txt,
                "series": [
                    {"nombre": "Rural", "valores": rural, "color": "datos"},
                    {"nombre": "Urbana", "valores": urbana, "color": "base"},
                ],
                "nota": "El tipo de sección es la clasificación del INE. No se muestran las secciones mixtas.",
            },
            "fuente": fuente(rango),
        }

    # 6. La participación en las intermedias ha ido bajando desde 2009. (Falso)
    def mito_tendencia() -> dict:
        anios_inter = list(inter)
        vals_inter = [inter[x] for x in anios_inter]
        comprobar(all(b > a_ for a_, b in zip(vals_inter, vals_inter[1:])), "tendencia",
                  lambda: "la participación en las intermedias no subió cada vez: " + " → ".join(
                      f"{pct(v)} ({x})" for x, v in zip(anios_inter, vals_inter)) + ".")
        return {
            "id": "tendencia",
            "enunciado": "La participación en las elecciones intermedias ha ido bajando desde 2009.",
            "veredicto": "falso",
            "dato": {"cifra": pct(vals_inter[-1]), "texto": f"votó en la intermedia de {anios_inter[-1]}, contra {pct(vals_inter[0])} en {anios_inter[0]}."},
            "resumen": ("Cada intermedia tuvo más participación que la anterior. "
                        "Para comparar bien hay que ver elecciones del mismo tipo."),
            "explicacion": (
                "Cada elección intermedia ha tenido más participación que la anterior. "
                f"Votó el {pct(vals_inter[0])} en {anios_inter[0]}, el {pct(vals_inter[1])} en "
                f"{anios_inter[1]} y el {pct(vals_inter[2])} en {anios_inter[2]}. Para comparar bien hay que "
                "ver elecciones del mismo tipo, porque en las presidenciales siempre vota más gente."
            ),
            "grafica": {
                "tipo": "columnas",
                "titulo": "Participación en las elecciones intermedias",
                "x": [str(x) for x in anios_inter],
                "series": [{"nombre": "Participación", "valores": vals_inter, "color": "datos"}],
            },
            "fuente": fuente(f"{anios_inter[0]}, {anios_inter[1]} y {anios_inter[2]}"),
        }

    # 11. Las personas de 60 a 69 años son las que más votan. (Cierto)
    def mito_60() -> dict:
        picos = []
        for x in ANIOS:
            d = ev["m8_mayores"][str(x)]
            picos.append({"etiqueta": f"{x}: {etiqueta_grupo(d['grupo_mas_alto'])} años",
                          "valor": d["valor_mas_alto"], "color": "datos"})
            comprobar(d["grupo_mas_alto"] in ("60-64", "65-69"), "60 a 69",
                      lambda: f"en {x} el grupo que más votó fue el de {etiqueta_grupo(d['grupo_mas_alto'])} años.")
        decadas = df.assign(DECADA=(df["EDAD"] // 10 * 10).clip(upper=80))
        g_dec = participacion(decadas, ["AELEC", "DECADA"])
        maximos = {x: int(g_dec[g_dec["AELEC"] == x].set_index("DECADA")["PART"].idxmax()) for x in ANIOS}
        comprobar(all(v == 60 for v in maximos.values()), "60 a 69 (por décadas)",
                  lambda: "por décadas de edad, la que más votó no fue la de 60 a 69 en " + ", ".join(
                      f"{x} (fue la de {v} a {v + 9})" for x, v in maximos.items() if v != 60) + ".")
        return {
            "id": "sesentas",
            "enunciado": "Las personas de 60 a 69 años son las que más votan.",
            "veredicto": "cierto",
            "dato": {"cifra": pct(ev['m8_mayores'][a]['valor_mas_alto']),
                     "texto": f"votó el grupo de {etiqueta_grupo(ev['m8_mayores'][a]['grupo_mas_alto'])} años en 2024."},
            "resumen": (f"En las 6 elecciones, el grupo que más votó tuvo entre 60 y 69 años. "
                        f"El {promedio} fue de {pct(nac[2024])}."),
            "explicacion": (
                "En las 6 elecciones desde 2009, el grupo de edad que más votó tuvo entre 60 y 69 años. "
                f"En 2024 fue el de {etiqueta_grupo(ev['m8_mayores'][a]['grupo_mas_alto'])} años, con "
                f"{pct(ev['m8_mayores'][a]['valor_mas_alto'])}, muy por encima del {promedio} "
                f"({pct(nac[2024])})."
            ),
            "grafica": {
                "tipo": "barras",
                "titulo": "Grupo de edad con mayor participación en cada elección",
                "items": picos,
            },
            "fuente": fuente(rango),
        }

    # 8. Las personas de 85 años o más son las que menos votan. (Cierto)
    def mito_mayores() -> dict:
        g85_todos = participacion(df, ["AELEC", "GRUPO85"]).pivot(index="GRUPO85", columns="AELEC", values="PART")
        comprobar(all(g85_todos[x].idxmin() == "85+" for x in ANIOS), "85 años o más",
                  lambda: "el grupo que menos votó no fue el de 85 años o más en " + ", ".join(
                      f"{x} (fue el de {etiqueta_grupo(g85_todos[x].idxmin())} años)"
                      for x in ANIOS if g85_todos[x].idxmin() != "85+") + ".")
        g85 = g85_todos[2024]
        valores = [r1(g85[g]) for g in GRUPOS_85]
        siguiente = g85.drop("85+").idxmin()
        return {
            "id": "mayores",
            "enunciado": "Las personas de 85 años o más son las que menos votan.",
            "veredicto": "cierto",
            "dato": {"cifra": pct(g85["85+"]), "texto": "votó el grupo de 85 años o más en 2024."},
            "resumen": (f"Fue el grupo que menos votó en las 6 elecciones. Es pequeño: el "
                        f"{pct(ev['pct_lista_85_mas'][a])} de la lista nominal."),
            "explicacion": (
                "En las 6 elecciones desde 2009, el grupo de 85 años o más fue el que menos votó. "
                f"En 2024 votó el {pct(g85['85+'])}, frente al {pct(g85[siguiente])} del grupo de "
                f"{etiqueta_grupo(siguiente)} años, el siguiente más bajo. Es un grupo pequeño: el "
                f"{pct(ev['pct_lista_85_mas'][a])} de la lista nominal."
            ),
            "grafica": {
                "tipo": "barras",
                "titulo": "Participación por grupo de edad, 2024",
                "items": [
                    {"etiqueta": "85 años o más" if g == "85+" else f"{etiqueta_grupo(g)} años", "valor": v,
                     "color": "acento" if g == "85+" else "base"}
                    for g, v in zip(GRUPOS_85, valores)
                ],
            },
            "fuente": fuente("2024"),
        }

    omitidos = []

    def intentar(construir) -> dict | None:
        try:
            m = construir()
        except MitoNoSostenido as error:
            if ambito is None:
                raise SystemExit(f"{error} {error.detalle} Revísalo.".replace("  ", " "))
            explicacion = f"Se omite el mito «{error.mito}» en {lugar}: {error.detalle}"
            print(f"  {explicacion}")
            omitidos.append(explicacion)
            return None
        if m["id"] not in DISCUSION:
            raise SystemExit(f"Falta la pregunta de discusión del mito '{m['id']}'.")
        if not (m.get("dato") and m.get("resumen")) or m["explicacion"].startswith(("Es falso", "Es cierto", "Es al revés")):
            raise SystemExit(f"El mito '{m['id']}' debe traer dato, resumen y una explicación sin repetir el veredicto.")
        m["discusion"] = DISCUSION[m["id"]]
        return m

    m = {nombre: intentar(f) for nombre, f in [
        ("sexo", mito_sexo), ("campo", mito_campo), ("intermedias", mito_intermedias),
        ("primer-voto", mito_18), ("jovenes", mito_jovenes),
        ("sesentas", mito_60), ("mayores", mito_mayores), ("tendencia", mito_tendencia),
    ]}

    # Arco narrativo: panorama, el primer voto y su caída en el centro, y lo que pasa con los años.
    niveles = [
        {"nombre": f"Así vota {lugar}",
         "intro": "Primero, un repaso: quién vota y en qué elecciones.",
         "mitos": [m["sexo"], m["campo"], m["intermedias"]]},
        {"nombre": "El primer voto",
         "intro": "Ahora, el centro de esta historia: qué pasa cuando cumples 18.",
         "mitos": [m["primer-voto"], m["jovenes"]]},
        {"nombre": "Que el primer voto no sea el último",
         "intro": "¿Y después del primer voto? Veamos qué pasa con los años.",
         "mitos": [m["sesentas"], m["mayores"], m["tendencia"]]},
    ]
    for n in niveles:
        n["mitos"] = [x for x in n["mitos"] if x is not None]
    niveles = [n for n in niveles if n["mitos"]]

    # El cierre retoma la caída solo si los datos la sostienen en este ámbito.
    if m["primer-voto"] is not None and serie[hasta - 1] > minimo:
        texto_cierre = (
            f"El primer voto entusiasma: a los 18 años se vota más que el {promedio}. "
            f"Después la participación baja y llega a su punto más bajo cerca de los {edad_min} años. "
            "Con los años vuelve a subir. El reto es que tu primer voto no sea el último."
        )
    else:
        texto_cierre = (
            "La participación cambia con la edad, el lugar y el tipo de elección. "
            "El reto es que tu primer voto no sea el último."
        )

    return {
        "ambito": {"clave": 0 if ambito is None else ambito["clave"], "nombre": lugar},
        "titulo": f"¿Cuánto sabes de cómo vota {lugar}?",
        "nota_metodo": (
            "Participación = personas que votaron ÷ (personas que votaron + personas que no votaron), "
            "según los cuadernillos de la lista nominal. No incluye casillas especiales ni el voto desde "
            "el extranjero, por eso puede diferir un poco de los resultados oficiales."
        ),
        "niveles": niveles,
        "cierre": {"titulo": "Que tu primer voto no sea el último", "texto": texto_cierre},
        "omitidos": omitidos,
        "proxima_eleccion": PROXIMA_ELECCION,
        "presidenciales": sorted(PRESIDENCIALES),
    }


# ---------------------------------------------------------------- datos para personalizar

def celda(g: pd.DataFrame, por: list[str]) -> dict:
    """Participación por `por`, vacía (None) si la lista nominal no llega al umbral."""
    p = participacion(g, por)
    return {
        (k if len(por) > 1 else (k[0] if isinstance(k, tuple) else k)):
        (r1(fila.PART) if fila.LN >= UMBRAL_LISTA_NOMINAL and fila.SV + fila.NV > 0 else None)
        for k, fila in p.set_index(por).iterrows()
    }


def relacion(a: float | None, b: float | None) -> str | None:
    """Compara a contra b: 'mayor', 'menor' o 'empate' (diferencia menor a EMPATE_PUNTOS)."""
    if a is None or b is None:
        return None
    if abs(a - b) < EMPATE_PUNTOS:
        return "empate"
    return "mayor" if a > b else "menor"


def datos_personales(d: pd.DataFrame, clave: int) -> dict:
    """Participación local por edad, grupo, sexo y tipo de sección, y los «Y en tu caso…» de cada mito."""
    d = d.assign(EDAD85=d["EDAD"].clip(upper=85))
    por_edad_c = celda(d, ["AELEC", "EDAD85"])
    por_grupo_c = celda(d, ["AELEC", "GRUPO85"])
    total_c = celda(d, ["AELEC"])
    sexo_c = celda(d[d["SEXO"].isin([0, 1])], ["AELEC", "SEXO"])
    tipo_c = celda(d, ["AELEC", "TIPOSEC"])
    rango = lambda desde, hasta: celda(d[(d["EDAD"] >= desde) & (d["EDAD"] <= hasta)], ["AELEC"])
    v18, v18_29, v60_69 = rango(18, 18), rango(18, 29), rango(60, 69)

    edades = EDADES_PERSONAL + [85]
    datos = {
        "clave": clave,
        "nombre": "México" if clave == 0 else ENTIDADES[clave],
        "anios": ANIOS,
        "umbral": UMBRAL_LISTA_NOMINAL,
        "edades": [str(e) for e in EDADES_PERSONAL] + ["85+"],
        "grupos": [etiqueta_grupo(g) for g in GRUPOS_85],
        "por_edad": {str(a): [por_edad_c.get((a, e)) for e in edades] for a in ANIOS},
        "por_grupo": {str(a): [por_grupo_c.get((a, g)) for g in GRUPOS_85] for a in ANIOS},
        "total": {str(a): total_c.get(a) for a in ANIOS},
        "sexo": {str(a): {"mujeres": sexo_c.get((a, 1)), "hombres": sexo_c.get((a, 0))} for a in ANIOS},
        "tipo": {str(a): {"rural": tipo_c.get((a, "R")), "urbana": tipo_c.get((a, "U"))} for a in ANIOS},
        "estimar": {str(a): {"18": v18.get(a), "18_29": v18_29.get(a), "60_69": v60_69.get(a)} for a in ANIOS},
    }
    if clave:
        datos["en_tu_caso"] = en_tu_caso(datos)
    return datos


def en_tu_caso(p: dict) -> dict:
    """Para cada mito, el dato del estado y si coincide con el veredicto nacional.
    'coincide' = el estado va en el mismo sentido que el veredicto; 'contrario' = pasó al revés;
    'empate' = diferencia menor a EMPATE_PUNTOS; 'sin_datos' = celdas bajo el umbral."""
    a = str(ANIOS[-1])
    total = {int(x): v for x, v in p["total"].items()}
    out = {}

    m, h = p["sexo"][a]["mujeres"], p["sexo"][a]["hombres"]
    rel = relacion(m, h)
    out["sexo"] = {"anio": int(a), "mujeres": m, "hombres": h,
                   "relacion": "sin_datos" if rel is None else {"mayor": "coincide", "empate": "empate", "menor": "contrario"}[rel]}

    rural = [p["tipo"][str(x)]["rural"] for x in ANIOS]
    urbana = [p["tipo"][str(x)]["urbana"] for x in ANIOS]
    if any(v is None for v in rural + urbana):
        out["campo"] = {"anio": int(a), "relacion": "sin_datos"}
    else:
        siempre_menos = all(relacion(r, u) == "menor" for r, u in zip(rural, urbana))
        rel24 = relacion(rural[-1], urbana[-1])
        out["campo"] = {"anio": int(a), "rural": rural[-1], "urbana": urbana[-1],
                        "relacion": "contrario" if siempre_menos else ("empate" if rel24 == "empate" else "coincide")}

    inter = {x: total[x] for x in ANIOS if x not in PRESIDENCIALES}
    pres = {x: total[x] for x in ANIOS if x in PRESIDENCIALES}
    mi, mp = max(inter, key=inter.get), min(pres, key=pres.get)
    rel = relacion(inter[mi], pres[mp])
    out["intermedias"] = {"intermedia": [mi, inter[mi]], "presidencial": [mp, pres[mp]],
                          "relacion": {"menor": "coincide", "empate": "empate", "mayor": "contrario"}[rel]}

    v18, prom = p["estimar"][a]["18"], total[int(a)]
    rel = relacion(v18, prom)
    out["primer-voto"] = {"anio": int(a), "v18": v18, "promedio": prom,
                          "relacion": "sin_datos" if rel is None else {"mayor": "coincide", "empate": "empate", "menor": "contrario"}[rel]}

    j = p["estimar"][a]["18_29"]
    out["jovenes"] = {"anio": int(a), "v18_29": j, "promedio": prom,
                      "relacion": "sin_datos" if j is None else ("coincide" if j >= 100 / 3 else "contrario")}

    grupos = p["por_grupo"][a]
    validos = [(g, v) for g, v in zip(p["grupos"], grupos) if v is not None]
    g_max = max(validos, key=lambda x: x[1])
    g_min = min(validos, key=lambda x: x[1])
    out["sesentas"] = {"anio": int(a), "grupo": g_max[0], "valor": g_max[1],
                       "relacion": "coincide" if g_max[0] in ("60–64", "65–69") else "contrario"}
    out["mayores"] = {"anio": int(a), "grupo": g_min[0], "valor": g_min[1], "v85": grupos[-1],
                      "relacion": "coincide" if g_min[0] == p["grupos"][-1] else "contrario"}

    serie = [[x, inter[x]] for x in inter]
    subidas = [relacion(b[1], a_[1]) for a_, b in zip(serie, serie[1:])]
    out["tendencia"] = {"intermedias": serie,
                        "relacion": "coincide" if all(s == "mayor" for s in subidas)
                        else ("empate" if all(s in ("mayor", "empate") for s in subidas) else "contrario")}
    return out


def construir_personal(df: pd.DataFrame) -> dict:
    """personal.json del país (clave 0) y de las 32 entidades."""
    salida = {0: datos_personales(df, 0)}
    for clave in ENTIDADES:
        salida[clave] = datos_personales(df[df["EDOCVE"] == clave], clave)
    return salida


def construir_municipios() -> dict | None:
    """municipios.json por entidad: participación total por municipio y año (vacía bajo el umbral)."""
    if not MUNICIPIOS.exists():
        return None
    m = pd.read_csv(MUNICIPIOS, dtype={"MPIONOM": "string"})
    m["PART"] = 100 * m["SV"] / (m["SV"] + m["NV"])
    salida = {}
    for clave in ENTIDADES:
        e = m[(m["EDOCVE"] == clave) & m["MPIONOM"].notna()]
        lista = []
        for (mpio, nombre), g in e.groupby(["MPIOCVE", "MPIONOM"]):
            g = g.set_index("AELEC")
            lista.append({
                "clave": int(mpio),
                "nombre": str(nombre).strip(),
                "participacion": {
                    str(a): (r1(g.loc[a, "PART"]) if a in g.index and g.loc[a, "LN"] >= UMBRAL_LISTA_NOMINAL
                             and g.loc[a, "SV"] + g.loc[a, "NV"] > 0 else None)
                    for a in ANIOS
                },
            })
        lista.sort(key=lambda x: x["nombre"])
        salida[clave] = {"clave": clave, "anios": ANIOS, "umbral": UMBRAL_LISTA_NOMINAL, "municipios": lista}
    return salida


def validar_municipios(rutas: dict) -> None:
    faltan = [c for c in ENTIDADES if c not in rutas or not rutas[c].exists()]
    if faltan:
        raise SystemExit(f"Faltan archivos municipios.json de las claves {faltan}.")
    for clave, ruta in rutas.items():
        d = json.loads(ruta.read_text(encoding="utf-8"))
        if not d["municipios"]:
            raise SystemExit(f"municipios.json de la clave {clave} no tiene municipios.")
        valores = [v for x in d["municipios"] for v in x["participacion"].values() if v is not None]
        if any(not 0 <= v <= 100 for v in valores):
            raise SystemExit(f"municipios.json de la clave {clave} tiene valores fuera de 0 a 100.")


def validar_personal(rutas: dict) -> None:
    """Se detiene si falta un archivo, una cifra clave o hay valores fuera de 0 a 100."""
    faltan = [c for c in [0, *ENTIDADES] if c not in rutas or not rutas[c].exists()]
    if faltan:
        raise SystemExit(f"Faltan archivos personal.json de las claves {faltan}.")
    for clave, ruta in rutas.items():
        p = json.loads(ruta.read_text(encoding="utf-8"))
        valores = [v for a in p["por_edad"].values() for v in a] + [v for a in p["por_grupo"].values() for v in a]
        valores += list(p["total"].values())
        valores += [v for s in p["sexo"].values() for v in s.values()]
        valores += [v for s in p["tipo"].values() for v in s.values()]
        valores += [v for s in p["estimar"].values() for v in s.values()]
        fuera = [v for v in valores if v is not None and not 0 <= v <= 100]
        if fuera:
            raise SystemExit(f"personal.json de la clave {clave} tiene valores fuera de 0 a 100: {fuera[:5]}")
        for a in map(str, ANIOS):
            if p["total"][a] is None or any(v is None for v in p["por_grupo"][a][:13]):
                raise SystemExit(f"personal.json de la clave {clave} no tiene datos suficientes en {a}.")
            if any(v is None for v in p["por_edad"][a][: EDADES_PERSONAL.index(60)]):
                raise SystemExit(f"personal.json de la clave {clave}: falta participación de 18 a 59 años en {a}.")




def guardar_json(ruta: Path, datos: dict, silencioso: bool = False) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    if not silencioso:
        print(f"  {ruta.relative_to(RAIZ)} ({ruta.stat().st_size / 1024:.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--rehacer", action="store_true", help="vuelve a leer los ZIP crudos")
    parser.add_argument("--entidad", type=int, choices=sorted(ENTIDADES), metavar="CLAVE",
                        help="genera el juego con datos de un solo estado (clave INE de 1 a 32)")
    args = parser.parse_args()

    df = preparar(cargar(args.rehacer))
    if args.entidad:
        generar_entidad(df, args.entidad)
        return
    salidas, ev = construir_salidas(df)

    print("Escribiendo salidas:")
    for nombre in PUBLICAR:
        guardar_json(SITIO_DATOS / f"{nombre}.json", salidas[nombre])
    rutas = {}
    for clave, datos in construir_personal(df).items():
        rutas[clave] = SITIO_DATOS / "entidad" / str(clave) / "personal.json"
        guardar_json(rutas[clave], datos, silencioso=clave not in (0, 6))
    validar_personal(rutas)
    print(f"  personal.json de 33 ámbitos validados (umbral: {UMBRAL_LISTA_NOMINAL:,} personas por celda)")
    municipios = construir_municipios()
    if municipios is None:
        print("  Sin agregado municipal: para generar municipios.json ejecuta --rehacer con los ZIP del INE.")
    else:
        rutas_m = {}
        for clave, datos in municipios.items():
            rutas_m[clave] = SITIO_DATOS / "entidad" / str(clave) / "municipios.json"
            guardar_json(rutas_m[clave], datos, silencioso=clave != 6)
        validar_municipios(rutas_m)
        total = sum(len(d["municipios"]) for d in municipios.values())
        print(f"  municipios.json de 32 entidades validados ({total:,} municipios)")
    with open(PROCESADOS / "evidencia_mitos.json", "w", encoding="utf-8") as f:
        json.dump(ev, f, ensure_ascii=False, indent=2)
    print(f"  {(PROCESADOS / 'evidencia_mitos.json').relative_to(RAIZ)}")


def generar_entidad(df: pd.DataFrame, clave: int) -> None:
    """Juego con datos de un solo estado. Los mitos que no se cumplen ahí se omiten."""
    nombre = ENTIDADES[clave]
    df_ent = df[df["EDOCVE"] == clave]
    s = estadisticas(df_ent)
    ev = evidencia(df_ent, s)
    print(f"Generando el juego de {nombre} (clave {clave}):")
    mitos = construir_mitos(df_ent, s, ev, ambito={"clave": clave, "nombre": nombre})
    total = sum(len(n["mitos"]) for n in mitos["niveles"])
    if total == 0:
        raise SystemExit(f"Ningún mito se sostiene con los datos de {nombre}; no se generó el juego.")
    guardar_json(SITIO_DATOS / "entidad" / str(clave) / "mitos.json", mitos)
    print(f"  {total} de {total + len(mitos['omitidos'])} mitos se sostienen con los datos de {nombre}.")
    print(f"  Abre el juego con: index.html?entidad={clave}")


if __name__ == "__main__":
    main()
