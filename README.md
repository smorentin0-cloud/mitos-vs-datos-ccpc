# Mitos vs. Datos: el juego

Trivia web interactiva sobre la participación electoral en México. Cada pregunta plantea una frase común sobre quién vota en México (algunas son mitos y otras son datos reales); la persona responde **Cierto** o **Falso**, y entonces se revela una gráfica con el dato real de los Conteos Censales de Participación Ciudadana (CCPC) 2009–2024 del INE, junto con una explicación en lenguaje ciudadano. Al final se genera una tarjeta de resultado descargable (PNG, 1080 × 1350) para retar a otras personas.

Proyecto para el hackatón del INE **«Hackea la participación: Datos que construyen democracia»**, Reto 3: Storytelling con datos.

**Sitio:** https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/

## Mensaje central y público

- **Mensaje central:** muchas ideas que repetimos sobre la participación no coinciden con los datos; la participación cambia con la edad, el sexo, el lugar y el tipo de elección, y cada voto cuenta.
- **Público:** jóvenes de 18 a 29 años, escuelas y talleres de educación cívica. Lenguaje sin tecnicismos, pensado para el celular.

## Fuente de datos

- INE, [Plataforma de Conteos Censales de Participación Ciudadana](https://ine.mx/transparencia/datos-abiertos/visualizacion-datos/conteos-censales-participacion/), elecciones federales de 2009, 2012, 2015, 2018, 2021 y 2024.
- Se usan solo datos **agregados** (sección electoral × sexo × edad), sin datos personales. El sitio publica cifras aún más agregadas (nacional, estatal, por tipo de sección y por grupo de edad).
- Limitación: la CCPC se basa en los cuadernillos de la lista nominal; no incluye casillas especiales ni voto desde el extranjero, por lo que sus cifras pueden diferir un poco de los cómputos oficiales.

## Metodología

**Participación = SV / (SV + NV)**, igual que la plataforma CCPC:
SV = registros con marca de voto, NV = registros sin marca de voto. Los registros no especificados (NS) se excluyen del cálculo (de 0.2% a 6.8% de la lista nominal, según el año).

Los veredictos los deciden los datos. `scripts/procesar.py` genera los textos con las cifras calculadas y **se detiene** si los datos dejan de sostener alguno de los veredictos aprobados.

Cada frase tiene una sola respuesta, **Cierto** o **Falso**, y se comprueba en **las 6 elecciones** (2009–2024), no solo en una.

| Frase | Cómo se verifica (en las 6 elecciones) | Veredicto |
|-------|-----------------------------------------|-----------|
| «Los jóvenes no votan.» | Participación de 18–29 años: nunca fue menor a un tercio (mínimo 35.9% en 2009). | Falso |
| «A los 18 años se vota menos que el promedio nacional.» | Participación a los 18 años vs. promedio nacional: siempre fue mayor. | Falso |
| «Los hombres votan más que las mujeres.» | Participación de mujeres vs. hombres: las mujeres siempre votaron más. La opción no binaria (solo 2024, 105 registros) no entra en la comparación. | Falso |
| «En el campo siempre se ha votado menos que en la ciudad.» | Participación por tipo de sección del INE: lo rural fue igual o mayor que lo urbano en todas; en 2009–2021 también con el método alterno (NS como no votantes). En 2024 hay un empate práctico. | Falso |
| «Las personas de 60 a 69 años son las que más votan.» | El grupo quinquenal con mayor participación fue 60–64 o 65–69, y la década 60–69 fue la más alta. | Cierto |
| «En las elecciones intermedias vota menos gente que en las presidenciales.» | La intermedia con más participación (2021, 51.8%) quedó debajo de la presidencial con menos (2024, 59.7%); también en número de votantes. | Cierto |
| «La participación en las elecciones intermedias ha ido bajando desde 2009.» | Intermedias: 44.1% (2009) → 47.1% (2015) → 51.8% (2021). | Falso |
| «Las personas de 85 años o más son las que menos votan.» | El grupo de 85 años o más tuvo la participación más baja de todos los grupos de edad. | Cierto |

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
│   ├── js/voz.js             # lectura en voz alta
│   ├── js/explora.js         # sección «Explora los datos»
│   └── data/                 # mitos.json, explora.json, entidades.json
└── .github/workflows/pages.yml   # publicación en GitHub Pages
```

## Aprovechamiento institucional

- **Material para talleres:** funciona en el celular, sin instalar nada, y se juega en unos 5 minutos; sirve para abrir sesiones de educación cívica en escuelas y en las Juntas Locales y Distritales.
- **Actualizable:** al publicarse los conteos de una nueva elección basta con agregar el ZIP y ejecutar `python scripts/procesar.py`; los textos y cifras se regeneran solos y el script avisa si algún veredicto deja de cumplirse.
- **Adaptable por estado:** la sección «Explora los datos» ya filtra por entidad; las preguntas pueden generarse para un estado en particular con el mismo script.
- **Ligero y sin costo de operación:** sitio estático sin servidor ni base de datos; puede alojarse en cualquier servidor del INE.

## Diseño y accesibilidad

- **Identidad:** la boleta y el cuadernillo de la lista nominal, de donde salen los Conteos Censales. Cada pregunta es una boleta, la respuesta se marca con una X en un recuadro y el veredicto aparece como un sello.
- **Personas con discapacidad visual:** botón **Voz** que lee en voz alta cada pregunta y, al responder, el resultado, la explicación y lo que muestra la gráfica, con voz en español de México cuando el dispositivo la tiene (Web Speech API, sin servicios externos). También hay botones «Escuchar» para pedir la lectura cuando se quiera. Está apagado por defecto para no encimarse con los lectores de pantalla.
- **Personas con discapacidad auditiva:** el juego no depende del sonido. Toda la retroalimentación es visual y textual (marca, sello, ícono y texto, nunca solo color), con frases cortas en lenguaje sencillo.
- **Personas mayores y con baja visión:** tipografía Lexend (diseñada para la fluidez lectora), texto base de 18 px, control de tamaño de letra (A, A+, A++) que también agranda las gráficas, botones de al menos 44 px y contraste AA.
- **Lectores de pantalla y teclado:** gráficas SVG con título y descripción, tabla con los datos de cada gráfica, foco visible y navegación completa con teclado.
- **Niñas, niños y jóvenes:** mecánica de marcar la boleta, casillas de progreso que se llenan y tarjeta de resultado para retar a otras personas.
- Respeta la preferencia de movimiento reducido y de alto contraste. Diseño mobile-first, sin frameworks ni paso de compilación; los datos del sitio pesan menos de 30 KB.
- Paleta neutral, sin colores asociados a partidos: texto `#1F2937`, datos `#2563EB`, base `#E5E7EB`, acento `#D97706`, blanco y grises.
- Sin `localStorage`: el estado del juego vive en memoria.

## Créditos

Equipo: **[NOMBRE DEL EQUIPO]**

Integrantes: **[INTEGRANTES]**

Datos: Instituto Nacional Electoral (INE), Conteos Censales de Participación Ciudadana 2009–2024.

## Licencia y derechos

Conforme a la **Base Décimo primera** de la convocatoria, el equipo cede al INE los derechos patrimoniales de este trabajo por **10 años**, y su difusión será exclusivamente con fines institucionales y/o educativos. Las personas integrantes conservan la autoría y el reconocimiento como creadoras de la obra. Por eso el proyecto **no** usa una licencia abierta; ver [`LICENSE`](LICENSE).

Los datos son del INE y se usan conforme a sus términos de datos abiertos.
