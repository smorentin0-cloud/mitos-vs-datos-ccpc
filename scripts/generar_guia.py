"""
Genera site/guia.html a partir de docs/guia-facilitacion.md, para que la guía se lea dentro del sitio
(y sin conexión) sin mantener dos copias a mano.

Uso:
    python scripts/generar_guia.py

Convierte solo lo que usa la guía: títulos (#, ##), párrafos, listas, tablas, negritas, código y enlaces.
"""

import html
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ORIGEN = RAIZ / "docs" / "guia-facilitacion.md"
DESTINO = RAIZ / "site" / "guia.html"


def en_linea(texto: str) -> str:
    t = html.escape(texto, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"&lt;(https?://[^&]+)&gt;", r'<a href="\1">\1</a>', t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    return t


def convertir(md: str) -> str:
    salida, lista, tabla = [], None, []

    def cerrar_lista():
        nonlocal lista
        if lista:
            salida.append(f"</{lista}>")
            lista = None

    def cerrar_tabla():
        if not tabla:
            return
        cab, *filas = [f for f in tabla if not re.fullmatch(r"\|[-| ]+\|", f)]
        celdas = lambda f: [c.strip() for c in f.strip("|").split("|")]
        salida.append("<table><thead><tr>" + "".join(f"<th>{en_linea(c)}</th>" for c in celdas(cab)) + "</tr></thead><tbody>")
        for f in filas:
            salida.append("<tr>" + "".join(f"<td>{en_linea(c)}</td>" for c in celdas(f)) + "</tr>")
        salida.append("</tbody></table>")
        tabla.clear()

    for linea in md.splitlines():
        if linea.startswith("|"):
            cerrar_lista()
            tabla.append(linea)
            continue
        cerrar_tabla()
        if not linea.strip():
            cerrar_lista()
        elif linea.startswith("# "):
            cerrar_lista()
            salida.append(f'<h1 class="titular">{en_linea(linea[2:])}</h1>')
        elif linea.startswith("## "):
            cerrar_lista()
            salida.append(f"<h2>{en_linea(linea[3:])}</h2>")
        elif re.match(r"\d+\. ", linea):
            if lista != "ol":
                cerrar_lista()
                salida.append("<ol>")
                lista = "ol"
            salida.append(f"<li>{en_linea(re.sub(r'^\d+\. ', '', linea))}</li>")
        elif linea.startswith("- "):
            if lista != "ul":
                cerrar_lista()
                salida.append("<ul>")
                lista = "ul"
            salida.append(f"<li>{en_linea(linea[2:])}</li>")
        else:
            cerrar_lista()
            salida.append(f"<p>{en_linea(linea)}</p>")
    cerrar_lista()
    cerrar_tabla()
    return "\n      ".join(salida)


PLANTILLA = """<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Guía de facilitación: Mitos vs. Datos</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body class="guia">
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <header class="barra">
    <a class="marca" href="./">
      <svg class="marca-icono" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="2" y="2" width="24" height="24" rx="3" fill="#FFFFFF" stroke="#1D1D1D" stroke-width="2.5"/>
        <path d="M8 8 L20 20 M20 8 L8 20" stroke="#C31C78" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
      <span>Mitos vs. Datos</span>
    </a>
  </header>
  <main id="contenido" tabindex="-1">
    <article class="texto-guia">
      {contenido}
    </article>
    <p><a href="./">Volver al juego</a></p>
  </main>
</body>
</html>
"""


def main() -> None:
    contenido = convertir(ORIGEN.read_text(encoding="utf-8"))
    DESTINO.write_text(PLANTILLA.replace("{contenido}", contenido), encoding="utf-8")
    print(f"  {DESTINO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
