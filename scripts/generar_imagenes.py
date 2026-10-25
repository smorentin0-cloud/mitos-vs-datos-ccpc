"""
Genera las imágenes fijas del sitio con la identidad de boleta y la paleta del proyecto.

Uso:
    pip install pillow qrcode
    python scripts/generar_imagenes.py

Salidas (site/img/):
    vista-previa.png  1200 x 630, para WhatsApp y redes (og:image)
    qr.png            código QR que lleva al sitio (se dibuja en la tarjeta de resultado)

Solo se ejecuta cuando cambia el diseño o la dirección del sitio; el sitio no depende de este script.
"""

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[1]
IMG = RAIZ / "site" / "img"
FUENTE = RAIZ / "scripts" / "recursos" / "Lexend[wght].ttf"
URL_SITIO = "https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/"

TINTA = "#1F2937"
TINTA_SUAVE = "#4B5563"
AZUL = "#2563EB"
AMBAR = "#D97706"
MESA = "#F3F4F6"
PERFORADO = "#9CA3AF"


def fuente(tamano: int, peso: int = 400) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FUENTE), tamano)
    f.set_variation_by_axes([peso])
    return f


def linea_punteada(d: ImageDraw.ImageDraw, x0: int, x1: int, y: int, ancho: int = 4) -> None:
    x = x0
    while x < x1:
        d.line([(x, y), (min(x + 16, x1), y)], fill=PERFORADO, width=ancho)
        x += 28


def recuadro(d: ImageDraw.ImageDraw, x: int, y: int, lado: int, marcado: bool) -> None:
    d.rectangle([x, y, x + lado, y + lado], fill="white", outline=TINTA, width=6)
    if marcado:
        m = lado * 0.24
        d.line([(x + m, y + m), (x + lado - m, y + lado - m)], fill=AZUL, width=9)
        d.line([(x + lado - m, y + m), (x + m, y + lado - m)], fill=AZUL, width=9)


def sello(texto: str, tamano: int) -> Image.Image:
    f = fuente(tamano, 700)
    caja = f.getbbox(texto)
    w, h = caja[2] - caja[0] + 60, caja[3] - caja[1] + 44
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([2, 2, w - 3, h - 3], outline=AMBAR, width=6)
    d.rectangle([12, 12, w - 13, h - 13], outline=AMBAR, width=3)
    d.text((w / 2, h / 2), texto, font=f, fill=AMBAR, anchor="mm")
    return img.rotate(6, expand=True, resample=Image.BICUBIC)


def vista_previa() -> None:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), MESA)
    d = ImageDraw.Draw(img)

    # Hoja de boleta con talón perforado
    x0, y0, x1, y1 = 60, 50, 1140, 580
    d.rectangle([x0, y0, x1, y1], fill="white", outline=TINTA, width=5)
    linea_punteada(d, x0 + 4, x1 - 4, y0 + 88)
    d.text((x0 + 50, y0 + 46), "Mitos vs. Datos", font=fuente(40, 700), fill=TINTA, anchor="lm")
    s = sello("¿MITO O DATO?", 30)
    img.paste(s, (x1 - s.width - 40, y0 + 46 - s.height // 2), s)

    d.text((x0 + 50, y0 + 130), "¿Cuánto sabes de cómo", font=fuente(70, 700), fill=TINTA)
    d.text((x0 + 50, y0 + 218), "vota México?", font=fuente(70, 700), fill=TINTA)

    # Los dos recuadros de la portada: Mito y Dato (marcado)
    y_op = y0 + 340
    recuadro(d, x0 + 50, y_op, 70, False)
    d.text((x0 + 140, y_op + 35), "Mito", font=fuente(44, 700), fill=TINTA, anchor="lm")
    recuadro(d, x0 + 330, y_op, 70, True)
    d.text((x0 + 420, y_op + 35), "Dato", font=fuente(44, 700), fill=TINTA, anchor="lm")

    d.text((x0 + 50, y1 - 50), "Juego de cierto o falso con datos del INE, 2009–2024",
           font=fuente(28), fill=TINTA_SUAVE, anchor="lm")
    img.save(IMG / "vista-previa.png", optimize=True)


def codigo_qr() -> None:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(URL_SITIO)
    qr.make(fit=True)
    qr.make_image(fill_color=TINTA, back_color="white").convert("RGB").save(IMG / "qr.png", optimize=True)


def main() -> None:
    IMG.mkdir(parents=True, exist_ok=True)
    vista_previa()
    codigo_qr()
    for p in sorted(IMG.glob("*.png")):
        print(f"  {p.relative_to(RAIZ)} ({p.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
