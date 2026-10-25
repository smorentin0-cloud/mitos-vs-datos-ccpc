"""
Procesa los Conteos Censales de Participación Ciudadana (CCPC) 2009-2024 del INE
y genera archivos JSON pequeños para el juego "Mitos vs. Datos".

Uso:
    python scripts/procesar.py            # usa el agregado en caché si existe
    python scripts/procesar.py --rehacer  # vuelve a leer los ZIP crudos

Entradas (data/raw/):  ccpc_2009.zip, ccpc_2012.zip, ..., ccpc_2024.zip
Salidas:
    data/processed/conteos_agregados.csv  (entidad x tipo de sección x sexo x edad)
    data/processed/evidencia_mitos.json   (cifras usadas para evaluar cada mito)
    site/data/*.json                      (datos que consume el sitio)

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


def leer_anio(anio: int) -> pd.DataFrame:
    """Lee todos los CSV estatales de un año y los agrega por las LLAVES."""
    ruta = RAW / f"ccpc_{anio}.zip"
    partes = []
    with zipfile.ZipFile(ruta) as zf:
        for nombre in sorted(n for n in zf.namelist() if n.lower().endswith(".csv")):
            with zf.open(nombre) as f:
                df = pd.read_csv(
                    f,
                    usecols=COLUMNAS,
                    dtype={"TIPOSEC": "string"},
                    encoding="utf-8-sig",
                    encoding_errors="replace",
                )
            df["TIPOSEC"] = df["TIPOSEC"].str.strip().str.upper().str[0]
            partes.append(df.groupby(COLUMNAS[:4], dropna=False)[CONTEOS].sum().reset_index())
            print(f"  {anio} {nombre.split('/')[-1]}: {len(df):,} filas")
    agregado = pd.concat(partes, ignore_index=True)
    agregado.insert(0, "AELEC", anio)
    return agregado


def cargar(rehacer: bool) -> pd.DataFrame:
    if AGREGADO.exists() and not rehacer:
        print(f"Usando agregado en caché: {AGREGADO.relative_to(RAIZ)}")
        return pd.read_csv(AGREGADO, dtype={"TIPOSEC": "string"})
    faltantes = [a for a in ANIOS if not (RAW / f"ccpc_{a}.zip").exists()]
    if faltantes:
        raise SystemExit(
            f"Faltan los archivos {faltantes} en data/raw/. Consulta el README para descargarlos."
        )
    df = pd.concat([leer_anio(a) for a in ANIOS], ignore_index=True)
    df = df.groupby(LLAVES, dropna=False)[CONTEOS].sum().reset_index()
    PROCESADOS.mkdir(parents=True, exist_ok=True)
    df.to_csv(AGREGADO, index=False)
    print(f"Guardado {AGREGADO.relative_to(RAIZ)} ({len(df):,} filas)")
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


def construir_salidas(df: pd.DataFrame) -> tuple[dict, dict]:
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

    salidas = {
        "nacional": nacional,
        "edad": edad,
        "sexo": sexo,
        "tipo_seccion": tipo_seccion,
        "entidades": entidades,
        "explora": explora,
    }
    ev = evidencia(df, salidas)
    salidas["mitos"] = construir_mitos(df, salidas, ev)
    return salidas, ev


def evidencia(df: pd.DataFrame, s: dict) -> dict:
    """Cifras concretas para evaluar cada mito candidato."""
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
    for a in ANIOS:
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

def fuente(anios: str) -> str:
    return f"Fuente: INE, Conteos Censales de Participación Ciudadana, {anios}."


def pct(x: float) -> str:
    return f"{x:.1f}%"


def comprobar(condicion: bool, mito: str) -> None:
    """Detiene el proceso si los datos ya no sostienen el veredicto aprobado."""
    if not condicion:
        raise SystemExit(f"Los datos ya no sostienen el veredicto del mito '{mito}'. Revísalo.")


def construir_mitos(df: pd.DataFrame, s: dict, ev: dict) -> dict:
    """Textos, veredictos y datos de gráfica de cada mito. Todas las cifras salen de los datos."""
    nac = ev["nacional"]
    a = "2024"
    anios_txt = [str(x) for x in ANIOS]
    rango = f"{ANIOS[0]}–{ANIOS[-1]}"

    # 1. Los jóvenes no votan. (Falso)
    j = ev["m1_jovenes"][a]
    millones = ev["jovenes_18_29"][a]["votaron_millones"]
    min_jov = min(ev["m1_jovenes"][str(x)]["18_29"] for x in ANIOS)
    anio_min_jov = min(ANIOS, key=lambda x: ev["m1_jovenes"][str(x)]["18_29"])
    comprobar(min_jov >= 100 / 3, "jóvenes")
    m_jovenes = {
        "id": "jovenes",
        "enunciado": "Los jóvenes no votan.",
        "veredicto": "falso",
        "explicacion": (
            f"Es falso. En 2024 votó el {pct(j['18_29'])} de las personas de 18 a 29 años: {millones} millones. "
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
                {"etiqueta": "Promedio nacional", "valor": nac[2024], "color": "base"},
            ],
        },
        "fuente": fuente("2024"),
    }

    # 2. A los 18 años se vota menos que el promedio nacional. (Falso)
    edades = s["edad"]["edades"]
    serie = s["edad"]["por_edad"][a]
    hasta = edades.index(40) + 1
    jovenes = serie[:12]
    minimo = min(jovenes)
    edad_min = edades[jovenes.index(minimo)]
    comprobar(all(s["edad"]["por_edad"][str(x)][0] > nac[x] for x in ANIOS), "18 años")
    m_18 = {
        "id": "primer-voto",
        "enunciado": "A los 18 años se vota menos que el promedio nacional.",
        "veredicto": "falso",
        "explicacion": (
            "Es al revés: a los 18 años se vota más que el promedio nacional, y así fue en las 6 "
            f"elecciones desde 2009. En 2024 votó el {pct(serie[0])} de quienes tenían 18 años, frente "
            f"al {pct(nac[2024])} nacional. La participación baja después: llega a {pct(minimo)} a los "
            f"{edad_min} años y luego vuelve a subir."
        ),
        "grafica": {
            "tipo": "linea",
            "titulo": "Participación por edad, de 18 a 40 años, 2024",
            "x": [str(e) for e in edades[:hasta]],
            "x_titulo": "Edad",
            "series": [{"nombre": "2024", "valores": serie[:hasta], "color": "datos"}],
            "referencia": {"valor": nac[2024], "etiqueta": f"Promedio nacional: {pct(nac[2024])}"},
            "marcas": [0, jovenes.index(minimo)],
        },
        "fuente": fuente("2024"),
    }

    # 3. Los hombres votan más que las mujeres. (Falso)
    hom = s["sexo"]["total"]["Hombres"]
    muj = s["sexo"]["total"]["Mujeres"]
    comprobar(all(m > h for m, h in zip(muj, hom)), "sexo")
    desde = ev["m3_sexo"][a]["grupos_donde_hombres_votan_mas"][0].split("-")[0]
    m_sexo = {
        "id": "sexo",
        "enunciado": "Los hombres votan más que las mujeres.",
        "veredicto": "falso",
        "explicacion": (
            "Es al revés: las mujeres votaron más que los hombres en las 6 elecciones desde 2009. "
            f"En 2024 votó el {pct(muj[-1])} de las mujeres y el {pct(hom[-1])} de los hombres. "
            f"Solo a partir de los {desde} años los hombres votaron un poco más."
        ),
        "grafica": {
            "tipo": "columnas",
            "titulo": f"Participación por sexo, {rango}",
            "x": anios_txt,
            "series": [
                {"nombre": "Mujeres", "valores": muj, "color": "datos"},
                {"nombre": "Hombres", "valores": hom, "color": "base"},
            ],
            "nota": "En 2024 se registró por primera vez la opción no binaria (105 registros); no se incluye en esta comparación.",
        },
        "fuente": fuente(rango),
    }

    # 4. En las intermedias vota menos gente que en las presidenciales. (Cierto)
    inter = {x: nac[x] for x in ANIOS if x not in PRESIDENCIALES}
    pres = {x: nac[x] for x in ANIOS if x in PRESIDENCIALES}
    max_inter = max(inter, key=inter.get)
    min_pres = min(pres, key=pres.get)
    comprobar(inter[max_inter] < pres[min_pres], "intermedias")
    m_intermedias = {
        "id": "intermedias",
        "enunciado": "En las elecciones intermedias vota menos gente que en las presidenciales.",
        "veredicto": "cierto",
        "explicacion": (
            "Es cierto. En las 3 intermedias votó menos gente que en cualquiera de las 3 presidenciales: "
            f"la intermedia con más participación ({max_inter}, {pct(inter[max_inter])}) quedó debajo de la "
            f"presidencial con menos ({min_pres}, {pct(pres[min_pres])}). En las intermedias se elige la "
            "Cámara de Diputados, pero no la Presidencia."
        ),
        "grafica": {
            "tipo": "columnas",
            "titulo": f"Participación nacional por elección, {rango}",
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
    tp = s["tipo_seccion"]["participacion"]
    rural, urbana = tp["Rural"], tp["Urbana"]
    rob = ev["tipo_seccion_robustez"]
    # Falso con cualquier método: hay elecciones donde lo rural supera a lo urbano también con SV/LN.
    comprobar(all(r >= u for r, u in zip(rural, urbana))
              and any(rob[str(x)]["Rural"]["sv_entre_ln"] > rob[str(x)]["Urbana"]["sv_entre_ln"] for x in ANIOS),
              "campo")
    m_campo = {
        "id": "campo",
        "enunciado": "En el campo siempre se ha votado menos que en la ciudad.",
        "veredicto": "falso",
        "explicacion": (
            "Es falso: en todas las elecciones desde 2009 se votó igual o más en las secciones rurales "
            f"que en las urbanas. En 2021, por ejemplo, votó el {pct(rural[4])} en secciones rurales y el "
            f"{pct(urbana[4])} en urbanas. En 2024 quedaron prácticamente empatadas "
            f"({pct(rural[5])} y {pct(urbana[5])})."
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
    anios_inter = list(inter)
    vals_inter = [inter[x] for x in anios_inter]
    comprobar(all(b > a_ for a_, b in zip(vals_inter, vals_inter[1:])), "tendencia")
    m_tendencia = {
        "id": "tendencia",
        "enunciado": "La participación en las elecciones intermedias ha ido bajando desde 2009.",
        "veredicto": "falso",
        "explicacion": (
            "Es al revés: cada elección intermedia ha tenido más participación que la anterior. "
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
    picos = []
    for x in ANIOS:
        d = ev["m8_mayores"][str(x)]
        picos.append({"etiqueta": f"{x}: {etiqueta_grupo(d['grupo_mas_alto'])} años",
                      "valor": d["valor_mas_alto"], "color": "datos"})
        comprobar(d["grupo_mas_alto"] in ("60-64", "65-69"), "60 a 69")
    decadas = df.assign(DECADA=(df["EDAD"] // 10 * 10).clip(upper=80))
    g_dec = participacion(decadas, ["AELEC", "DECADA"])
    comprobar(all(g_dec[g_dec["AELEC"] == x].set_index("DECADA")["PART"].idxmax() == 60 for x in ANIOS),
              "60 a 69 (por décadas)")
    m_60 = {
        "id": "sesentas",
        "enunciado": "Las personas de 60 a 69 años son las que más votan.",
        "veredicto": "cierto",
        "explicacion": (
            "Es cierto. En las 6 elecciones desde 2009, el grupo de edad que más votó tuvo entre 60 y 69 años. "
            f"En 2024 fue el de {etiqueta_grupo(ev['m8_mayores'][a]['grupo_mas_alto'])} años, con "
            f"{pct(ev['m8_mayores'][a]['valor_mas_alto'])}, muy por encima del promedio nacional "
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
    g85_todos = participacion(df, ["AELEC", "GRUPO85"]).pivot(index="GRUPO85", columns="AELEC", values="PART")
    comprobar(all(g85_todos[x].idxmin() == "85+" for x in ANIOS), "85 años o más")
    g85 = g85_todos[2024]
    valores = [r1(g85[g]) for g in GRUPOS_85]
    siguiente = g85.drop("85+").idxmin()
    m_mayores = {
        "id": "mayores",
        "enunciado": "Las personas de 85 años o más son las que menos votan.",
        "veredicto": "cierto",
        "explicacion": (
            "Es cierto. En las 6 elecciones desde 2009, el grupo de 85 años o más fue el que menos votó. "
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

    return {
        "nota_metodo": (
            "Participación = personas que votaron ÷ (personas que votaron + personas que no votaron), "
            "según los cuadernillos de la lista nominal. No incluye casillas especiales ni el voto desde "
            "el extranjero, por eso puede diferir un poco de los resultados oficiales."
        ),
        "niveles": [
            {"nombre": "El primer voto", "mitos": [m_jovenes, m_18]},
            {"nombre": "¿Quién vota más?", "mitos": [m_sexo, m_campo, m_60]},
            {"nombre": "Para expertos", "mitos": [m_intermedias, m_tendencia, m_mayores]},
        ],
    }


def guardar_json(ruta: Path, datos: dict) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {ruta.relative_to(RAIZ)} ({ruta.stat().st_size / 1024:.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--rehacer", action="store_true", help="vuelve a leer los ZIP crudos")
    args = parser.parse_args()

    df = preparar(cargar(args.rehacer))
    salidas, ev = construir_salidas(df)

    print("Escribiendo salidas:")
    for nombre in PUBLICAR:
        guardar_json(SITIO_DATOS / f"{nombre}.json", salidas[nombre])
    with open(PROCESADOS / "evidencia_mitos.json", "w", encoding="utf-8") as f:
        json.dump(ev, f, ensure_ascii=False, indent=2)
    print(f"  {(PROCESADOS / 'evidencia_mitos.json').relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
