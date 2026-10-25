# Mitos vs. Datos: el juego

Trivia web interactiva sobre la participación electoral en México. Cada pregunta plantea un mito común; la persona responde si cree que es **Cierto**, **Falso** o **Parcialmente cierto**, y entonces se revela una gráfica con el dato real de los Conteos Censales de Participación Ciudadana (CCPC) 2009–2024 del INE, junto con una explicación en lenguaje ciudadano. Al final se genera una tarjeta de resultado descargable (PNG, 1080 × 1350) para retar a otras personas.

Proyecto para el hackatón del INE **«Hackea la participación: Datos que construyen democracia»**, Reto 3: Storytelling con datos.

**Sitio:** https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/

Público: jóvenes de 18 a 29 años, escuelas y talleres de educación cívica.

## Fuente de datos

- INE, [Plataforma de Conteos Censales de Participación Ciudadana](https://ine.mx/transparencia/datos-abiertos/visualizacion-datos/conteos-censales-participacion/), elecciones federales de 2009, 2012, 2015, 2018, 2021 y 2024.
- Se usan solo datos **agregados** (sección electoral × sexo × edad), sin datos personales. El sitio publica cifras aún más agregadas (nacional, estatal, por tipo de sección y por grupo de edad).
- Limitación: la CCPC se basa en los cuadernillos de la lista nominal; no incluye casillas especiales ni voto desde el extranjero, por lo que sus cifras pueden diferir un poco de los cómputos oficiales.

## Metodología

**Participación = SV / (SV + NV)**, igual que la plataforma CCPC:
SV = registros con marca de voto, NV = registros sin marca de voto. Los registros no especificados (NS) se excluyen del cálculo (de 0.2% a 6.8% de la lista nominal, según el año).

Los veredictos los deciden los datos. `scripts/procesar.py` genera los textos con las cifras calculadas y **se detiene** si los datos dejan de sostener alguno de los veredictos aprobados.

| Mito | Cálculo | Veredicto |
|------|---------|-----------|
| «Los jóvenes no votan.» | Participación de 18–29 años vs. 30 años o más y vs. promedio nacional (2024); votantes de 18–29 años en millones. | Falso |
| «A los 18 años nadie vota; ya que crecen, empiezan a votar.» | Participación por edad simple de 18 a 40 años (2024), comparada con el promedio nacional; se revisa en las 6 elecciones. | Falso |
| «Los hombres votan más que las mujeres.» | Participación de mujeres y hombres por elección, 2009–2024. La opción no binaria (solo 2024, 105 registros) no entra en la comparación. | Falso |
| «En el campo se vota menos que en la ciudad.» | Participación por tipo de sección del INE (rural vs. urbana), 2009–2024. Se comprobó que el resultado se sostiene si los NS cuentan como no votantes, salvo 2024, que es prácticamente un empate. | Falso |
| «Las personas de 60 a 74 años son las que más votan.» | Grupo quinquenal de edad con la participación más alta en cada elección. | Cierto |
| «En las intermedias vota casi la misma gente que en las presidenciales.» | Participación nacional por elección; diferencia entre cada intermedia y la presidencial siguiente. | Falso |
| «La participación en México va en picada desde 2009.» | Serie de participación nacional 2009–2024 y número absoluto de votantes. | Falso |
| «Las personas mayores son las que menos votan.» | Participación por grupo quinquenal en 2024, con 85 años o más agrupados; peso de ese grupo en la lista nominal. | Parcialmente cierto |

El detalle de las cifras, los mitos descartados y las pruebas de robustez están en [`data/processed/hallazgos.md`](data/processed/hallazgos.md) y [`data/processed/evidencia_mitos.json`](data/processed/evidencia_mitos.json).

## Cómo reproducir el procesamiento

Requisitos: Python 3.10 o más reciente y pandas.

```bash
pip install -r requirements.txt
python scripts/procesar.py
```

El repositorio incluye el agregado `data/processed/conteos_agregados.csv`, así que el comando anterior funciona sin los archivos crudos. Para rehacer todo desde cero:

1. Descarga los ZIP de la [Plataforma CCPC](https://ine.mx/transparencia/datos-abiertos/visualizacion-datos/conteos-censales-participacion/) y guárdalos en `data/raw/` con estos nombres (no se suben al repositorio porque pesan de 40 a 82 MB cada uno):

   | Archivo en `data/raw/` | Descarga |
   |------------------------|----------|
   | `ccpc_2009.zip` | https://ine.mx/wp-content/uploads/2022/04/DatosAbiertos_DECEyEC_ConteosCensales2009.zip |
   | `ccpc_2012.zip` | https://ine.mx/wp-content/uploads/2022/04/DatosAbiertos_DECEyEC_ConteosCensales2012.zip |
   | `ccpc_2015.zip` | https://ine.mx/wp-content/uploads/2022/04/DatosAbiertos_DECEyEC_ConteosCensales2015.zip |
   | `ccpc_2018.zip` | https://ine.mx/wp-content/uploads/2022/04/DatosAbiertos_DECEyEC_ConteosCensales2018.zip |
   | `ccpc_2021.zip` | https://ine.mx/wp-content/uploads/2022/04/DatosAbiertos_DECEyEC_ConteosCensales2021.zip |
   | `ccpc_2024.zip` | https://ine.mx/wp-content/uploads/2025/08/DatosAbiertos_DECEyEC_ConteosCensales2024.zip |

2. Ejecuta `python scripts/procesar.py --rehacer` (tarda de 1 a 2 minutos; lee los ZIP sin descomprimirlos).

Para ver el sitio en tu computadora:

```bash
python -m http.server 8000 --directory site
```

y abre http://localhost:8000.

## Estructura del repositorio

```
├── data/
│   ├── raw/                  # ZIP del INE (no se suben; ver arriba)
│   └── processed/
│       ├── conteos_agregados.csv   # entidad × tipo de sección × sexo × edad × año
│       ├── evidencia_mitos.json    # cifras usadas para evaluar cada mito
│       └── hallazgos.md            # tabla de mitos, cifras y veredictos
├── scripts/
│   └── procesar.py           # limpieza, agregación y generación de JSON
├── site/                     # sitio estático (HTML, CSS y JavaScript sin frameworks)
│   ├── index.html
│   ├── css/estilos.css
│   ├── js/graficas.js        # gráficas SVG accesibles
│   ├── js/juego.js           # lógica del juego y tarjeta PNG
│   ├── js/explora.js         # sección «Explora los datos»
│   └── data/                 # mitos.json, explora.json, entidades.json
└── .github/workflows/pages.yml   # publicación en GitHub Pages
```

## Diseño y accesibilidad

- Mobile-first, sin dependencias externas ni paso de compilación; los datos del sitio pesan menos de 30 KB.
- Gráficas en SVG con título y descripción para lectores de pantalla y una tabla con los datos de cada gráfica.
- Navegable con teclado; respeta la preferencia de movimiento reducido.
- Paleta neutral, sin colores asociados a partidos: texto `#1F2937`, datos `#2563EB`, base `#E5E7EB`, acento `#D97706`, blanco y grises.
- Sin `localStorage`: el estado del juego vive en memoria.

## Créditos

Equipo: **[NOMBRE DEL EQUIPO]**

Integrantes: **[INTEGRANTES]**

Datos: Instituto Nacional Electoral (INE), Conteos Censales de Participación Ciudadana 2009–2024.

## Licencia y derechos

El código se publica bajo la licencia MIT (ver [`LICENSE`](LICENSE)).

**Cesión de derechos:** conforme a la Base Décimo primera de la convocatoria del hackatón «Hackea la participación: Datos que construyen democracia», los derechos patrimoniales de este proyecto se ceden al Instituto Nacional Electoral. Los datos son del INE y se usan conforme a sus términos de datos abiertos.
