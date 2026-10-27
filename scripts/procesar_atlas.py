"""
Atlas de la participación: genera los datos y el mapa de la pestaña «Atlas de la participación»
de «Ver los datos», a partir de la CCPC del INE.

Entradas:
  data/processed/conteos_agregados.csv        año × entidad × tipo de sección × sexo × edad (SV, NV, NS, LN),
                                              el mismo agregado que genera procesar.py
  data/fuentes/estados_natural_earth.geojson  límites estatales de Natural Earth (dominio público)

Salidas (site/data/):
  atlas.json   cifras por país, región y estado, y los textos de cada paso de la historia
  mapa.json    trazos SVG de los 32 estados ya proyectados

Participación = SV / (SV + NV), igual que la plataforma CCPC; los NS se excluyen.
Toda cifra que aparece en el sitio sale de aquí. Si un hallazgo deja de cumplirse con los
datos, el script se detiene (HallazgoNoSostenido) en lugar de publicar un texto falso.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.ops import transform, unary_union

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "data" / "fuentes"
PROCESADOS = RAIZ / "data" / "processed"
SALIDA = RAIZ / "site" / "data"

ANIOS = [2009, 2012, 2015, 2018, 2021, 2024]
PRESIDENCIALES = {2012, 2018, 2024}
ULTIMO = ANIOS[-1]
UMBRAL_LISTA_NOMINAL = 1000  # celdas con menos personas en la lista nominal no se publican

ENTIDADES = {
    1: ("Aguascalientes", "MX-AGU"), 2: ("Baja California", "MX-BCN"), 3: ("Baja California Sur", "MX-BCS"),
    4: ("Campeche", "MX-CAM"), 5: ("Coahuila", "MX-COA"), 6: ("Colima", "MX-COL"), 7: ("Chiapas", "MX-CHP"),
    8: ("Chihuahua", "MX-CHH"), 9: ("Ciudad de México", "MX-DIF"), 10: ("Durango", "MX-DUR"),
    11: ("Guanajuato", "MX-GUA"), 12: ("Guerrero", "MX-GRO"), 13: ("Hidalgo", "MX-HID"), 14: ("Jalisco", "MX-JAL"),
    15: ("Estado de México", "MX-MEX"), 16: ("Michoacán", "MX-MIC"), 17: ("Morelos", "MX-MOR"),
    18: ("Nayarit", "MX-NAY"), 19: ("Nuevo León", "MX-NLE"), 20: ("Oaxaca", "MX-OAX"), 21: ("Puebla", "MX-PUE"),
    22: ("Querétaro", "MX-QUE"), 23: ("Quintana Roo", "MX-ROO"), 24: ("San Luis Potosí", "MX-SLP"),
    25: ("Sinaloa", "MX-SIN"), 26: ("Sonora", "MX-SON"), 27: ("Tabasco", "MX-TAB"), 28: ("Tamaulipas", "MX-TAM"),
    29: ("Tlaxcala", "MX-TLA"), 30: ("Veracruz", "MX-VER"), 31: ("Yucatán", "MX-YUC"), 32: ("Zacatecas", "MX-ZAC"),
}

# Regiones geográficas para contar la historia (agrupación del equipo, no son las circunscripciones).
REGIONES = [
    ("noroeste", "Noroeste", [2, 3, 26, 25]),
    ("norte", "Norte", [8, 5, 10, 19, 28]),
    ("occidente", "Occidente y Bajío", [18, 14, 6, 16, 1, 11, 22, 32, 24]),
    ("centro", "Centro", [9, 15, 13, 17, 21, 29]),
    ("sur", "Sur", [12, 20, 7]),
    ("golfo", "Golfo y Península", [30, 27, 4, 31, 23]),
]

# Los mismos cortes que los mitos del juego: 18 a 29 (jóvenes), 60 a 69 (sesentas) y 85 y más (mayores).
# Los 18 años (primer voto) van aparte en "edad_18" porque se traslapan con 18 a 29.
GRUPOS_EDAD = [("18–29", 18, 29), ("30–44", 30, 44), ("45–59", 45, 59), ("60–69", 60, 69),
               ("70–84", 70, 84), ("85 y más", 85, 200)]
JOVENES, MAYORES = (18, 29), (65, 200)
SEXOS = {1: "Mujeres", 0: "Hombres"}
TIPOS_SECCION = {"U": "Urbana", "M": "Mixta", "R": "Rural"}


class HallazgoNoSostenido(Exception):
    """Los datos ya no sostienen un hallazgo del atlas: hay que revisar el texto con el equipo."""


def exigir(condicion: bool, mensaje: str) -> None:
    if not condicion:
        raise HallazgoNoSostenido(mensaje)


# ---------------------------------------------------------------- formato

def r1(v):
    return None if v is None or (isinstance(v, float) and math.isnan(v)) else round(float(v), 1)


def pct(v) -> str:
    return f"{v:.1f}%"


def pts(v) -> str:
    v = round(abs(v), 1)
    return f"{v:.1f} {'punto' if v == 1 else 'puntos'}"


# ---------------------------------------------------------------- participación

def cargar() -> pd.DataFrame:
    df = pd.read_csv(PROCESADOS / "conteos_agregados.csv", dtype={"TIPOSEC": "string"})
    df["REGION"] = df["EDOCVE"].map({e: rid for rid, _, es in REGIONES for e in es})
    return df


def participacion(df: pd.DataFrame, llaves: list[str]) -> pd.Series:
    """Participación por grupo; None si la lista nominal del grupo no llega al umbral."""
    g = df.groupby(llaves, observed=True)[["SV", "NV", "LN"]].sum()
    p = g["SV"] / (g["SV"] + g["NV"]) * 100
    return p.where(g["LN"] >= UMBRAL_LISTA_NOMINAL)


def edad_en(df, desde, hasta):
    return df[(df["EDAD"] >= desde) & (df["EDAD"] <= hasta)]


def detalle(df: pd.DataFrame) -> dict:
    """Por año: edad, sexo y tipo de sección de un ámbito (país o estado)."""
    salida = {}
    for anio in ANIOS:
        a = df[df["AELEC"] == anio]
        edad = [r1(participacion(edad_en(a, d, h).assign(K=0), ["K"]).get(0)) for _, d, h in GRUPOS_EDAD]
        sexo = participacion(a, ["SEXO"])
        sec = participacion(a, ["TIPOSEC"])
        salida[str(anio)] = {
            "edad": edad,
            "edad_18": r1(participacion(edad_en(a, 18, 18).assign(K=0), ["K"]).get(0)),
            "sexo": [r1(sexo.get(k)) for k in SEXOS],
            "seccion": [r1(sec.get(k)) for k in TIPOS_SECCION],
        }
    return salida


# ---------------------------------------------------------------- mapa

def proyeccion_lcc():
    """Cónica conforme de Lambert con los parámetros que usa INEGI para México."""
    f1, f2, f0, l0 = map(math.radians, (17.5, 29.5, 12.0, -102.0))
    t = lambda f: math.tan(math.pi / 4 + f / 2)
    n = math.log(math.cos(f1) / math.cos(f2)) / math.log(t(f2) / t(f1))
    F = math.cos(f1) * t(f1) ** n / n
    rho0 = F / t(f0) ** n

    def proyectar(lon, lat, z=None):
        rho = F / t(math.radians(lat)) ** n
        th = n * (math.radians(lon) - l0)
        return rho * math.sin(th), rho0 - rho * math.cos(th)

    def vectorizada(xs, ys, zs=None):
        pares = [proyectar(x, y) for x, y in zip(xs, ys)]
        return [p[0] for p in pares], [p[1] for p in pares]

    return vectorizada


def poligonos_utiles(geom) -> MultiPolygon:
    """Quita islas muy pequeñas o muy lejanas (como Revillagigedo) para que el zoom encuadre bien."""
    partes = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    mayor = max(partes, key=lambda p: p.area)
    guardar = [p for p in partes
               if p is mayor or (p.area >= mayor.area * 0.004 and p.distance(mayor) < 0.6)]
    return MultiPolygon(guardar)


def generar_mapa() -> dict:
    datos = json.loads((FUENTES / "estados_natural_earth.geojson").read_text(encoding="utf-8"))
    por_iso = {f["properties"]["iso"]: shape(f["geometry"]) for f in datos["features"]}
    lcc = proyeccion_lcc()
    proyectadas = {}
    for clave, (_, iso) in ENTIDADES.items():
        geom = poligonos_utiles(por_iso[iso])
        proyectadas[clave] = transform(lcc, geom)
    minx = min(g.bounds[0] for g in proyectadas.values())
    miny = min(g.bounds[1] for g in proyectadas.values())
    maxx = max(g.bounds[2] for g in proyectadas.values())
    maxy = max(g.bounds[3] for g in proyectadas.values())
    ancho = 1000.0
    k = ancho / (maxx - minx)
    alto = (maxy - miny) * k
    a_svg = lambda x, y, z=None: ((x - minx) * k, (maxy - y) * k)

    estados, svg_de = {}, {}
    for clave, geom in proyectadas.items():
        g = transform(lambda xs, ys, zs=None: ([a_svg(x, y)[0] for x, y in zip(xs, ys)],
                                               [a_svg(x, y)[1] for x, y in zip(xs, ys)]), geom)
        svg_de[clave] = g
        g = g.simplify(0.6, preserve_topology=True)
        trazos = []
        for p in (g.geoms if isinstance(g, MultiPolygon) else [g]):
            for anillo in [p.exterior, *p.interiors]:
                pts_ = list(anillo.coords)[:-1]
                trazos.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts_) + "Z")
        x0, y0, x1, y1 = g.bounds
        c = g.representative_point()
        estados[str(clave)] = {"d": "".join(trazos), "caja": [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
                               "centro": [round(c.x, 1), round(c.y, 1)]}
    # Contorno de cada región: unión de sus estados, para dibujar su borde y encuadrar el zoom.
    regiones = {}
    for rid, _, es in REGIONES:
        g = unary_union([svg_de[c] for c in es]).buffer(0.4).buffer(-0.4).simplify(0.8, preserve_topology=True)
        partes = g.geoms if isinstance(g, MultiPolygon) else [g]
        d = "".join("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in list(p.exterior.coords)[:-1]) + "Z" for p in partes)
        x0, y0, x1, y1 = g.bounds
        c = max(partes, key=lambda p: p.area).representative_point()
        regiones[rid] = {"d": d, "caja": [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
                         "centro": [round(c.x, 1), round(c.y, 1)]}

    return {"ancho": ancho, "alto": round(alto, 1), "estados": estados, "regiones": regiones,
            "fuente": "Límites estatales: Natural Earth (dominio público), proyección cónica conforme de Lambert."}


# ---------------------------------------------------------------- historia

def generar_atlas(df: pd.DataFrame) -> dict:
    nac = participacion(df, ["AELEC"])
    est = participacion(df, ["AELEC", "EDOCVE"])
    reg = participacion(df, ["AELEC", "REGION"])
    nombre = {c: n for c, (n, _) in ENTIDADES.items()}
    nombre_reg = {rid: n for rid, n, _ in REGIONES}

    def ranking(anio):
        s = est.loc[anio].sort_values(ascending=False)
        return {int(c): i + 1 for i, c in enumerate(s.index)}

    rank = {a: ranking(a) for a in ANIOS}
    u = ULTIMO

    # Participación de jóvenes (18–29) y mayores (65+) por región en el último año.
    ultimo = df[df["AELEC"] == u]
    jov = participacion(edad_en(ultimo, *JOVENES), ["REGION"])
    may = participacion(edad_en(ultimo, *MAYORES), ["REGION"])
    sec_reg = participacion(ultimo, ["REGION", "TIPOSEC"])
    jov_nac = participacion(edad_en(ultimo, *JOVENES).assign(K=0), ["K"])[0]
    may_nac = participacion(edad_en(ultimo, *MAYORES).assign(K=0), ["K"])[0]

    # ---------- pasos de apertura
    s_u = est.loc[u].sort_values(ascending=False)
    alto_c, bajo_c = int(s_u.index[0]), int(s_u.index[-1])
    bajaron = [c for c in ENTIDADES if est[(2021, c)] < est[(2018, c)]]
    exigir(nac[2021] < nac[2018], "La intermedia de 2021 ya no tiene menor participación que 2018.")
    apertura = [
        {"id": "pais", "anio": u, "resaltar": [],
         "titulo": f"México, {u}",
         "texto": f"En la elección de {u} votó el {pct(nac[u])} de las personas en la lista nominal. "
                  f"Pero ese promedio esconde un país muy distinto de un lugar a otro."},
        {"id": "extremos", "anio": u, "resaltar": [alto_c, bajo_c],
         "titulo": "No todo el país vota igual",
         "texto": f"En {u}, {nombre[alto_c]} fue el estado que más votó ({pct(s_u.iloc[0])}) y "
                  f"{nombre[bajo_c]} el que menos ({pct(s_u.iloc[-1])}): {pts(s_u.iloc[0] - s_u.iloc[-1])} de diferencia."},
        {"id": "intermedia", "anio": 2021, "resaltar": [],
         "titulo": "Sin presidencial, se vota menos",
         "texto": f"En 2021, sin elección de presidencia, votó el {pct(nac[2021])}: {pts(nac[2018] - nac[2021])} menos "
                  f"que en 2018. La participación bajó en {len(bajaron)} de los 32 estados."},
    ]

    # ---------- un hallazgo por región, cada uno verificado
    def mas_baja(anio):
        return reg.loc[anio].idxmin()

    hallazgos = {}

    n_bajo = sum(mas_baja(a) == "noroeste" for a in ANIOS)
    exigir(n_bajo >= 5, f"El Noroeste fue la región más baja solo en {n_bajo} de 6 elecciones.")
    exigir(jov.idxmin() == "noroeste", "Los jóvenes del Noroeste ya no son los que menos votan.")
    hallazgos["noroeste"] = (
        "La región que menos vota",
        f"En {n_bajo} de las 6 elecciones federales desde 2009, el Noroeste fue la región donde menos se votó. "
        f"En {u} votó el {pct(reg[(u, 'noroeste')])}, {pts(nac[u] - reg[(u, 'noroeste')])} menos que el país.",
        f"Sus jóvenes de 18 a 29 años son los que menos votan de las seis regiones: {pct(jov['noroeste'])} en {u}.",
    )

    norte = est.loc[u].loc[[c for c in REGIONES[1][2]]].sort_values(ascending=False)
    brecha = norte.iloc[0] - norte.iloc[-1]
    exigir(brecha >= 10, f"La diferencia dentro del Norte bajó a {brecha:.1f} puntos.")
    hallazgos["norte"] = (
        "Vecinos muy distintos",
        f"En {u}, {nombre[int(norte.index[0])]} votó el {pct(norte.iloc[0])} y {nombre[int(norte.index[-1])]} "
        f"el {pct(norte.iloc[-1])}: {pts(brecha)} de diferencia dentro de la misma región.",
        f"{nombre[int(norte.index[0])]} quedó en el lugar {rank[u][int(norte.index[0])]} de 32 y "
        f"{nombre[int(norte.index[-1])]} en el {rank[u][int(norte.index[-1])]}.",
    )

    distancia = (may - jov).dropna()
    exigir(distancia.idxmin() == "occidente", "Occidente y Bajío ya no tiene la menor distancia entre jóvenes y mayores.")
    hallazgos["occidente"] = (
        "Jóvenes y mayores, más cerca",
        f"Es la región donde jóvenes y mayores votan más parecido: en {u}, el {pct(jov['occidente'])} de las personas "
        f"de 18 a 29 años y el {pct(may['occidente'])} de las de 65 y más; {pts(distancia['occidente'])} de distancia, "
        f"la menor de las seis regiones.",
        f"En todo el país, esa distancia fue de {pts(may_nac - jov_nac)}.",
    )

    exigir(reg.loc[u].idxmax() == "centro", "El Centro ya no es la región con mayor participación.")
    subieron = [c for c in ENTIDADES if est[(2021, c)] > est[(2018, c)]]
    exigir(subieron == [29], f"Los estados que votaron más en 2021 que en 2018 ahora son {subieron}.")
    hallazgos["centro"] = (
        "La región que más vota",
        f"El Centro fue la región con mayor participación en {u}: {pct(reg[(u, 'centro')])}, "
        f"{pts(reg[(u, 'centro')] - nac[u])} más que el país.",
        f"Ahí está Tlaxcala, el único estado donde se votó más en la intermedia de 2021 "
        f"({pct(est[(2021, 29)])}) que en la presidencial de 2018 ({pct(est[(2018, 29)])}).",
    )

    rural_menos_urbana = (sec_reg.xs("R", level="TIPOSEC") - sec_reg.xs("U", level="TIPOSEC")).dropna()
    exigir(rural_menos_urbana.idxmax() == "sur" and rural_menos_urbana["sur"] >= 3,
           "En el Sur, lo rural ya no supera claramente a lo urbano.")
    exigir(mas_baja(2009) == "sur", "El Sur ya no fue la región más baja en 2009.")
    hallazgos["sur"] = (
        "Lo rural vota más",
        f"En el Sur, las secciones rurales votan más que las urbanas: {pct(sec_reg[('sur', 'R')])} contra "
        f"{pct(sec_reg[('sur', 'U')])} en {u}. Es la región con la mayor ventaja de lo rural.",
        f"En 2009 fue la región que menos votó ({pct(reg[(2009, 'sur')])}); en {u} votó el {pct(reg[(u, 'sur')])}.",
    )

    primeros_yuc = sum(rank[a][31] == 1 for a in ANIOS)
    exigir(primeros_yuc >= 3, f"Yucatán fue el primer lugar solo en {primeros_yuc} elecciones.")
    hallazgos["golfo"] = (
        "Yucatán marca el paso",
        f"Yucatán fue el estado con mayor participación en {primeros_yuc} de las 6 elecciones desde 2009; "
        f"en {u} votó el {pct(est[(u, 31)])}.",
        f"La región en conjunto votó el {pct(reg[(u, 'golfo')])} en {u}, "
        f"{'por encima' if reg[(u, 'golfo')] > nac[u] else 'por debajo'} del país.",
    )

    regiones = []
    for rid, rnombre, es in REGIONES:
        titulo, texto, extra = hallazgos[rid]
        orden = est.loc[u].loc[es].sort_values(ascending=False)
        regiones.append({
            "id": rid, "nombre": rnombre, "estados": es,
            "participacion": {str(a): r1(reg[(a, rid)]) for a in ANIOS},
            "titulo": titulo, "texto": texto, "extra": extra,
            "tabla": [[nombre[int(c)], r1(v)] for c, v in orden.items()],
        })

    estados = []
    for c, (n, _) in ENTIDADES.items():
        estados.append({
            "clave": c, "nombre": n,
            "region": next(rid for rid, _, es in REGIONES if c in es),
            "participacion": {str(a): r1(est[(a, c)]) for a in ANIOS},
            "lugar": {str(a): rank[a][c] for a in ANIOS},
            "detalle": detalle(df[df["EDOCVE"] == c]),
        })

    return {
        "anios": ANIOS,
        "presidenciales": sorted(PRESIDENCIALES),
        "ultimo": u,
        "grupos_edad": [g for g, _, _ in GRUPOS_EDAD],
        "sexos": list(SEXOS.values()),
        "secciones": list(TIPOS_SECCION.values()),
        "nacional": {
            "participacion": {str(a): r1(nac[a]) for a in ANIOS},
            "detalle": detalle(df),
        },
        "apertura": apertura,
        "regiones": regiones,
        "estados": estados,
        "fuente": "INE, Conteos Censales de Participación Ciudadana (CCPC), elecciones federales 2009–2024.",
        "metodo": "Participación = personas con marca de voto / (con marca + sin marca) en la lista nominal. "
                  "No incluye casillas especiales ni voto desde el extranjero. Las regiones son una agrupación "
                  f"geográfica del equipo. No se publican cifras de grupos con menos de {UMBRAL_LISTA_NOMINAL:,} "
                  "personas en la lista nominal.",
    }


def main() -> None:
    df = cargar()
    SALIDA.mkdir(parents=True, exist_ok=True)
    atlas = generar_atlas(df)
    mapa = generar_mapa()
    (SALIDA / "atlas.json").write_text(json.dumps(atlas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (SALIDA / "mapa.json").write_text(json.dumps(mapa, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"atlas.json: {len(atlas['regiones'])} regiones, {len(atlas['estados'])} estados")
    print(f"mapa.json: {(SALIDA / 'mapa.json').stat().st_size / 1024:.0f} KB")
    for p in atlas["apertura"]:
        print(f"- {p['titulo']}: {p['texto']}")
    for r in atlas["regiones"]:
        print(f"- {r['nombre']} · {r['titulo']}: {r['texto']} {r['extra']}")


if __name__ == "__main__":
    main()
