# Mitos vs. Datos: el juego

Trivia web interactiva sobre la participación electoral en México. Cada pregunta plantea una frase común sobre quién vota en México (algunas son mitos y otras son datos reales); la persona responde **Cierto** o **Falso**, y entonces se revela una gráfica con el dato real de los Conteos Censales de Participación Ciudadana (CCPC) 2009–2024 del INE, junto con una explicación en lenguaje ciudadano. Al final se genera una tarjeta de resultado descargable (PNG, 1080 × 1350) para retar a otras personas.

Proyecto para el hackatón del INE **«Hackea la participación: Datos que construyen democracia»**, Reto 3: Storytelling con datos.

**Sitio:** https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/

## Qué incluye

- **Juego de Cierto o Falso** con 8 frases en 3 niveles que siguen un arco: un panorama de quién vota, **el primer voto** al centro (a los 18 años se vota más que el promedio, pero después la participación cae hasta cerca de los 25) y lo que pasa con los años. El cierre retoma la idea: que el primer voto no sea el último.
- **Tu historia, de principio a fin:** antes de la primera pregunta, la persona dice su edad exacta, su estado y, si quiere, su municipio («Prefiero no decir» siempre está disponible). Un primer momento de historia le dice desde qué elección pudo votar y cuántas le han tocado.
- **«Y en tu caso…»:** después de cada veredicto nacional, el mismo dato para su estado o su edad, con su mini gráfica y su tabla. Si la persona dio su perfil, la figura abre en este dato; «México» queda en el selector. Si el dato local va en contra del veredicto, lo dice con claridad («En México es falso, pero en Sinaloa, en 2024, pasó al revés»), sin cambiar el sello. Si eligió su municipio, también aparece en las dos frases que responde su participación total (intermedias contra presidenciales y la tendencia de las intermedias), junto a la serie del estado; si el municipio no tiene datos de todas esas elecciones o queda bajo el umbral, lo dice.
- **«Adivina antes de ver»:** en 3 preguntas, la persona estima cuántas de cada 100 personas votaron antes de responder; al final se resume qué tan cerca estuvo.
- **Pictograma «100 personas como tú»:** 100 casillas de boleta con X en las que votaron, en el final, en la pregunta de jóvenes y en la tarjeta.
- **Tu historia como votante:** línea de tiempo de las elecciones 2009–2024 en las que tenía edad para votar, con la participación de su edad en su estado, y la próxima elección (junio de 2027) como una casilla vacía por marcar.
- **Una pantalla, una idea, una acción principal:** la portada solo invita a «Jugar»; el perfil cabe en una pantalla (estado con búsqueda accesible y municipio opcional); cada respuesta se revela en secuencia —el veredicto una sola vez, el dato clave, un resumen de dos frases y una sola gráfica con selector México | tu estado— con «Más contexto» plegado y «Siguiente» siempre a la mano. El resultado y el cierre son un recorrido de 4 pasos con indicador de progreso y Atrás/Siguiente: puntaje, 100 personas como tú, tu historia y estimaciones, y compromiso con tarjeta.
- **Compromiso y reto entre generaciones:** en el último paso se elige un compromiso que aparece en la tarjeta, y se puede retar a alguien de otra generación. El enlace de reto solo lleva el puntaje.
- **Tarjeta para compartir** (PNG 1080 × 1350; «Compartir mi tarjeta» usa el menú de compartir del celular con la imagen y, si no está disponible, la descarga) con el puntaje, el dato personalizado, un código QR al sitio y el reto «¿Me ganas?». Vista previa para WhatsApp y redes (Open Graph).
- **Pantalla «Para talleres»** (enlace «¿Das talleres?» en la portada) con el modo salón, la versión para imprimir y la guía.
- **Modo salón** para talleres con proyector: letra muy grande, el grupo vota a mano alzada, la persona facilitadora revela con un botón o con el teclado y cada pregunta trae una pregunta para conversar.
- **Versión para imprimir** (`imprimible.html`): tarjetas en tamaño carta con la frase al frente y la respuesta atrás, legibles en blanco y negro.
- **Versión por estado** con un solo comando, con demo principal de San Luis Potosí y demo de Colima.
- **Funciona sin conexión** después de la primera visita y no usa servicios externos.
- **Opciones de lectura** en el botón «Aa» del encabezado: lectura en voz alta y tamaño de letra (A, A+, A++). Gráficas con tabla de datos.
- **«Ver los datos»**, con dos pestañas:
  - **Explora los datos:** participación por edad y por estado, filtrable por año y estado.
  - **Atlas de la participación:** recorrido por el mapa de México que hace zoom del país a seis regiones, con un hallazgo verificado en cada una, y al final compara tu estado con el país por elección, edad, sexo y tipo de sección. Las regiones son una agrupación geográfica del equipo, no las circunscripciones. Límites estatales de [Natural Earth](https://www.naturalearthdata.com/) (dominio público).
- **«¿Cómo se calcula?»** plegado al pie de cada pantalla; el pie completo con créditos y licencia aparece en la portada y en «Ver los datos».
- **Guía de facilitación** de una página: [`docs/guia-facilitacion.md`](docs/guia-facilitacion.md).

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
python scripts/procesar_atlas.py   # mapa y textos del atlas (site/data/atlas.json y mapa.json)
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

Las imágenes fijas (vista previa para redes, código QR e íconos) se regeneran con `python scripts/generar_imagenes.py` (requiere `pillow` y `qrcode`); solo hace falta si cambia el diseño o la dirección del sitio.

Para ver el sitio en tu computadora:

```bash
python -m http.server 8000 --directory site
```

y abre http://localhost:8000.

## Personalización y privacidad

- **Nada sale del navegador.** La edad, el estado, el municipio, las estimaciones y el compromiso viven solo en la memoria de la página: no hay `localStorage`, `sessionStorage`, cookies ni analítica, y no se envían a ningún servidor. Al cerrar la pestaña se pierden.
- **Nada personal en la dirección.** El enlace de reto solo lleva el puntaje (`?reto=5-8`) y, si se juega una versión estatal, la edición (`?entidad=6&reto=3-4`), que es la página pública y no un dato de la persona; así el reto abre la misma edición.
- **Datos por estado bajo demanda.** `procesar.py` genera `site/data/entidad/<clave>/personal.json` (edad simple, grupos, sexo, tipo de sección y las comparaciones de «Y en tu caso…») y `municipios.json`. El sitio solo descarga el del estado que se elige.
- **Umbral de celdas pequeñas: 1,000 personas en la lista nominal.** Si una celda (por ejemplo, 83 años en un estado pequeño en 2009) tiene menos, no se publica: el sitio usa el grupo quinquenal o el dato nacional y lo dice en el texto. Con este umbral quedan vacías 47 de 13,056 celdas de edad simple y 175 municipios en 2024. Detalle en [`data/processed/hallazgos.md`](data/processed/hallazgos.md).
- **Edad en cada elección:** se calcula con la edad de hoy y el año del dispositivo, así que puede variar un año según el cumpleaños.
- **Próxima elección:** se configura en un solo lugar (`PROXIMA_ELECCION` en `procesar.py`).

## Versión por estado

Cualquier Junta Local puede generar el juego con los datos de su estado con un solo comando, usando la clave INE de la entidad (de 1 a 32):

```bash
python scripts/procesar.py --entidad 14   # 14 = Jalisco
```

El comando crea `site/data/entidad/14/mitos.json`. Al publicarlo (commit y push a `main`), el juego de ese estado queda en:

```
https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/?entidad=14
```

- Se aplican las mismas validaciones que en la versión nacional. Si con los datos del estado algún mito no se cumple en las 6 elecciones, **se omite** y la consola explica por qué con cifras, en lugar de mostrar un veredicto falso.
- Los textos se ajustan solos («promedio de Jalisco», «Así vota Jalisco»), igual que el cierre, el reto para compartir y la versión imprimible (`imprimible.html?entidad=14`).
- Si alguien abre un estado que no se ha generado, el sitio muestra la versión nacional con un aviso.
- Para que ese estado funcione sin conexión desde la primera visita, agrega su ruta a la lista `ARCHIVOS` de `site/sw.js` (si no, se guarda en cuanto se visita con internet).

**Demo principal: San Luis Potosí** (clave 24), en [`?entidad=24`](https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/?entidad=24). Con sus datos se sostienen los 8 mitos nacionales.

**Segunda demo: Colima** (clave 6), en [`?entidad=6`](https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/?entidad=6). Con sus datos se sostienen 4 de los 8 mitos.

## Estructura del repositorio

```
├── AGENTS.md                 # guía para colaborar: contexto, reglas y estado (personas e IA)
├── CLAUDE.md                 # importa AGENTS.md
├── data/
│   ├── raw/                  # ZIP del INE (no se suben; ver arriba)
│   └── processed/
│       ├── conteos_agregados.csv   # entidad × tipo de sección × sexo × edad × año
│       ├── municipios.csv          # participación total por municipio y año (con --rehacer)
│       ├── evidencia_mitos.json    # cifras usadas para evaluar cada mito
│       └── hallazgos.md            # tabla de mitos, cifras y veredictos
├── data/fuentes/estados_natural_earth.geojson   # límites estatales para el mapa del atlas
├── docs/
│   └── guia-facilitacion.md  # taller de 20 minutos
├── scripts/
│   ├── procesar.py           # limpieza, agregación, validaciones y JSON del sitio (--entidad)
│   ├── procesar_atlas.py     # atlas: cifras por región y estado, hallazgos verificados y mapa SVG
│   ├── generar_imagenes.py   # vista previa para redes, código QR e íconos
│   └── recursos/             # Lexend en TTF (licencia OFL) para generar las imágenes
├── site/                     # sitio estático (HTML, CSS y JavaScript sin frameworks)
│   ├── index.html            # juego, modo salón, resultado, cierre y «Ver los datos»
│   ├── imprimible.html       # tarjetas para imprimir
│   ├── sw.js                 # service worker: funciona sin conexión
│   ├── manifest.webmanifest
│   ├── css/                  # estilos.css, atlas.css e imprimible.css (@media print)
│   ├── js/textos.js          # textos que arma JavaScript (para traducir)
│   ├── js/datos.js           # rutas de datos y versión por estado (?entidad=)
│   ├── js/graficas.js        # gráficas SVG accesibles
│   ├── js/juego.js           # juego, perfil, estimaciones, modo salón, final y tarjeta PNG
│   ├── js/personal.js        # carga de datos por estado y respaldo edad → grupo → país
│   ├── js/caso.js            # «Y en tu caso…» de cada mito
│   ├── js/voz.js             # lectura en voz alta
│   ├── js/explora.js         # «Ver los datos»: pestañas y «Explora los datos»
│   ├── js/atlas.js           # pestaña «Atlas de la participación»: recorrido y comparación
│   ├── js/mapa.js / atlas-graficas.js   # mapa SVG con zoom y gráficas del atlas
│   ├── js/imprimible.js      # arma las tarjetas para imprimir
│   ├── data/                 # mitos.json, explora.json, entidades.json, atlas.json, mapa.json y entidad/<clave>/ (mitos, personal, municipios)
│   ├── fonts/                # Lexend 400 y 700 en woff2, con su licencia OFL
│   └── img/                  # vista previa, código QR e íconos
└── .github/workflows/pages.yml   # publicación en GitHub Pages
```

## Aprovechamiento institucional

**Por qué hacen falta versiones por estado.** Un dato nacional no siempre describe a cada estado. En Colima, 4 de los 8 mitos nacionales no se cumplen con sus propios datos, y el script lo detecta solo:

- En las intermedias no siempre votó menos gente: la intermedia de 2015 (59.3%) superó a la presidencial de 2024 (56.4%).
- La participación en las intermedias no subió cada vez: 57.7% en 2009, 59.3% en 2015 y 51.9% en 2021.
- En 2024 el grupo que menos votó fue el de 25 a 29 años, no el de 85 años o más.
- En 2024, por décadas de edad, la que más votó fue la de 70 a 79 años, no la de 60 a 69.

Si una Junta Local de Colima usara la versión nacional, enseñaría cuatro afirmaciones que en su estado no son ciertas. Con `--entidad` cada estado recibe solo las frases que sus datos sostienen.

El proyecto es un **kit de educación cívica** listo para usarse en Juntas Locales y Distritales, escuelas y talleres:

| Pieza | Para qué sirve |
|---|---|
| Sitio en el celular | Que cada persona juegue sola en unos 5 minutos y comparta su tarjeta |
| Modo salón | Talleres con proyector: el grupo vota a mano alzada y se conversa cada respuesta |
| Versión para imprimir | Comunidades o escuelas sin dispositivos ni internet |
| Versión por estado | Que cada Junta Local use los datos de su entidad con un solo comando |
| Guía de facilitación | Un taller de 20 minutos paso a paso |

- **Actualizable:** al publicarse los conteos de una nueva elección basta con agregar el ZIP y ejecutar `python scripts/procesar.py`; los textos y cifras se regeneran solos y el script se detiene si algún veredicto deja de cumplirse.
- **Ligero y sin costo de operación:** sitio estático sin servidor ni base de datos ni servicios externos; puede alojarse en cualquier servidor del INE y funciona sin conexión.
- **Sin datos personales:** solo usa datos agregados de la CCPC; lo que la persona elige en el final personalizado vive en la memoria del navegador y nunca se guarda ni se envía.

## Fase 2 (no implementado)

- **Traducción a lenguas indígenas,** empezando por maya y náhuatl, con hablantes de cada lengua. Los textos ya están separados para facilitarlo: el texto fijo de las pantallas está en `site/index.html` e `imprimible.html`; el que arma JavaScript, en `site/js/textos.js`; y las frases, explicaciones y preguntas para conversar, en `scripts/procesar.py`.
- **Videos en Lengua de Señas Mexicana** por pregunta, junto a cada frase y cada explicación.

## Diseño y accesibilidad

- **Identidad:** la boleta y el cuadernillo de la lista nominal, de donde salen los Conteos Censales. Cada pregunta es una boleta, la respuesta se marca con una X en un recuadro y el veredicto aparece como un sello.
- **Personas con discapacidad visual:** botón **Voz** que lee en voz alta cada pregunta y, al responder, el resultado, la explicación y lo que muestra la gráfica, con voz en español de México cuando el dispositivo la tiene (Web Speech API, sin servicios externos). También hay botones «Escuchar» para pedir la lectura cuando se quiera. Está apagado por defecto para no encimarse con los lectores de pantalla.
- **Personas con discapacidad auditiva:** el juego no depende del sonido. Toda la retroalimentación es visual y textual (marca, sello, ícono y texto, nunca solo color), con frases cortas en lenguaje sencillo.
- **Personas mayores y con baja visión:** tipografía Lexend (diseñada para la fluidez lectora), texto base de 18 px, control de tamaño de letra (A, A+, A++) que también agranda las gráficas, botones de al menos 44 px y contraste AA.
- **Lectores de pantalla y teclado:** gráficas SVG con título y descripción, tabla con los datos de cada gráfica, foco visible y navegación completa con teclado.
- **Niñas, niños y jóvenes:** mecánica de marcar la boleta, casillas de progreso que se llenan y tarjeta de resultado para retar a otras personas.
- Respeta la preferencia de movimiento reducido y de alto contraste. Diseño mobile-first, sin frameworks ni paso de compilación.
- **Sin internet y sin servicios externos:** la fuente Lexend está alojada en `site/fonts/` (licencia OFL) y un service worker (`site/sw.js`) guarda el sitio en el dispositivo después de la primera visita, así funciona sin conexión en talleres. El workflow de publicación cambia la versión de la caché en cada commit, así que las actualizaciones llegan solas.
- **Peso:** la carga inicial es de unos 215 KB (código, fuentes y los datos nacionales). Los datos de cada estado se descargan solo si la persona lo elige: `personal.json` pesa unos 5 KB y `municipios.json` hasta 76 KB (Oaxaca). Con los datos de las 32 entidades, el sitio completo pesa unos 760 KB. Sin conexión funcionan el país y la demo de Colima; otros estados se guardan en cuanto se visitan con internet. La imagen de vista previa para redes (58 KB) solo la descargan WhatsApp y las redes sociales.
- Paleta neutral, sin colores asociados a partidos: texto `#1F2937`, datos `#2563EB`, base `#E5E7EB`, acento `#D97706`, blanco y grises.
- Sin `localStorage`: el estado del juego vive en memoria.

## Créditos

Equipo: **Agentes FIME**

Integrantes:

- Efrain Alejandro Arias Meza
- Sandra Odette Morentin Solano
- Nain Apolinar Juárez Aguilar

Datos: Instituto Nacional Electoral (INE), Conteos Censales de Participación Ciudadana 2009–2024.

## Licencia y derechos

Conforme a la **Base Décimo primera** de la convocatoria, el equipo cede al INE los derechos patrimoniales de este trabajo por **10 años**, y su difusión será exclusivamente con fines institucionales y/o educativos. Las personas integrantes conservan la autoría y el reconocimiento como creadoras de la obra. Por eso el proyecto **no** usa una licencia abierta; ver [`LICENSE`](LICENSE).

Los datos son del INE y se usan conforme a sus términos de datos abiertos.
