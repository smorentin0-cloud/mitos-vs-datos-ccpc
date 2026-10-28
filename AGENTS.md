# AGENTS.md: contexto del proyecto

Guía para cualquier persona del equipo y para la IA que trabaje en este repositorio (Claude Code, Codex, Cursor, Copilot u otra). Léela completa antes de cambiar algo. Si algo aquí contradice el código, avisa al equipo en lugar de adivinar.

## 1. Qué es el proyecto

**«Mitos vs. Datos: el juego»**: trivia web de Cierto o Falso sobre quién vota en México. Cada frase se responde y luego se revela el dato real con una gráfica y una explicación en lenguaje ciudadano. Al final hay una tarjeta PNG para compartir y retar a otras personas.

- **Convocatoria:** hackatón del INE «Hackea la participación: Datos que construyen democracia», **Reto 3: Storytelling con datos**.
- **Fuente única:** INE, Conteos Censales de Participación Ciudadana (CCPC), elecciones federales 2009, 2012, 2015, 2018, 2021 y 2024 (datos abiertos, agregados).
- **Fecha límite de entrega:** 31 de octubre de 2026, 23:59.
- **Sitio publicado:** https://smorentin0-cloud.github.io/mitos-vs-datos-ccpc/ (GitHub Pages, se publica solo al hacer push a `main`).
- **Equipo:** Agentes FIME: Efrain Alejandro Arias Meza, Sandra Odette Morentin Solano y Nain Apolinar Juárez Aguilar.

## 2. Idea central y mensaje

- Muchas ideas que repetimos sobre quién vota **no coinciden con los datos**. La participación cambia con la edad, el sexo, el lugar y el tipo de elección.
- **La persona que juega es la protagonista:** da su edad y su estado (o «Prefiero no decir»), y cada respuesta le muestra «Y en tu caso…», su historia como votante y «100 personas como tú».
- **Arco narrativo: «que tu primer voto no sea el último».** A los 18 años se vota más que el promedio; después la participación cae hasta cerca de los 25 años y con los años vuelve a subir. Los 8 mitos van en 3 niveles: panorama, el primer voto (centro de la historia) y lo que pasa con los años.
- **Público:** jóvenes de 18 a 29 años, escuelas y talleres de educación cívica. Lenguaje sin tecnicismos, pensado para el celular.

## 3. Qué enfatizar ante el jurado

Ligado a los criterios de evaluación de la convocatoria:

| Criterio | Qué mostrar |
|---|---|
| Apego al reto y uso de la CCPC | Storytelling con datos: cada frase se responde con cifras de la CCPC, con fuente y tabla en cada gráfica. |
| Claridad y solidez | Veredictos binarios verificados en **las 6 elecciones**, no en una. `procesar.py` **se detiene** (`MitoNoSostenido`) si un veredicto deja de cumplirse. Método igual al de la plataforma: participación = SV / (SV + NV). Limitaciones explicadas (sin casillas especiales ni voto en el extranjero). |
| Originalidad | Mecánica de boleta (marcar con X, sello del veredicto), personalización por edad y estado sin guardar datos, «Adivina antes de ver», línea de tiempo con la próxima elección como casilla vacía, reto entre generaciones. |
| Viabilidad y potencial institucional | Sitio estático sin costo de operación; kit para Juntas Locales y Distritales; versión por estado con un comando (`--entidad`); modo salón; versión imprimible; funciona sin conexión; actualizable al publicarse una nueva elección. |
| Accesibilidad e inclusión | AA, teclado completo, botón Voz (Web Speech API, sin servicios externos), A / A+ / A++, tabla de datos en cada gráfica, nada depende del sonido ni solo del color. |

Ejemplo fuerte para la presentación: en **Colima**, 4 de los 8 mitos nacionales no se cumplen con sus datos y el script los omite solo (detalle en el README, sección «Aprovechamiento institucional»).

## 4. Reglas que no se pueden romper

1. **Privacidad.** Edad, estado elegido, municipio, respuestas, estimaciones y compromiso viven solo en memoria. Sin `localStorage`, `sessionStorage`, cookies ni analítica. No se envían a ningún servidor ni van en la URL. El enlace de reto solo lleva la edición pública (`entidad=N`, que es la página, no un dato de la persona) y el puntaje (`reto=P-T`). **Excepción aprobada (27 oct. 2026):** la dirección del mapa lleva la vista (`#mapa?anio=…&ver=…&grupo=…`), y el estado solo entra cuando la persona pulsa «Copiar enlace a esta vista». El estado que viene del perfil del juego nunca va en la URL. La lengua de la página (`?lengua=nah|yua|tzh`) también puede ir en la URL: es la versión pública, como `entidad`.
2. **Toda cifra sale de `scripts/procesar.py`** (o de `scripts/procesar_atlas.py`, en el atlas). No escribas números a mano en HTML, JS ni documentos. No inventes cifras ni resultados de pruebas con usuarios.
3. **Veredictos binarios (Cierto / Falso) que no cambian.** Nada de «parcialmente cierto». Si una frase no se puede verificar en las 6 elecciones, se reformula. El dato local complementa, pero nunca cambia el sello nacional.
4. **Paleta del INE, sin colores de partidos** (tomada de ine.mx): tinta `#1D1D1D`, rosa `#C31C78` (marca y datos), base `#E5E7EB`, dorado oscuro `#766552` (sello y foco), fondo `#EFEBEB`, blanco y grises. Los mapas usan cinco tonos del rosa (`site/js/mapa.js`) y trama de rayas para «sin dato»; el gris de comparación es `#5E6573` (AA sobre el fondo). No uses el dorado claro `#C5A989` en texto ni en el foco: no llega a AA.
5. **Sin frameworks ni paso de compilación.** HTML, CSS y JavaScript sin dependencias; Python + pandas para los datos.
6. **Accesibilidad AA:** teclado, foco visible, `aria-live`, botones de al menos 44 px, `prefers-reduced-motion`, alto contraste, A / A+ / A++ sin scroll lateral, y el botón Voz debe leer todo (también lo plegado).
7. **«Una pantalla, una idea, una acción principal».** Un solo botón primario por pantalla o paso, como máximo un contenedor con borde, un titular dominante. **Excepción aprobada:** la portada tiene dos puertas del mismo peso (Juego y Mapa), que son su única acción. Espacios con las variables `--esp-1` a `--esp-6`.
8. **Textos nuevos en `site/js/textos.js`** (o en `procesar.py` si son de los mitos), para poder traducirlos.
9. **Al cambiar archivos del sitio, revisa `site/sw.js`:** agrega rutas nuevas a `ARCHIVOS`. La versión de caché (`__VERSION__`) la pone el workflow con el commit.
10. **Licencia y cesión:** conforme a la Base Décimo primera, los derechos patrimoniales se ceden al INE por 10 años. No cambies `LICENSE` ni quites el aviso de cesión.
11. **No subas los ZIP crudos del INE** (`data/raw/`, de 40 a 82 MB cada uno) ni la convocatoria en PDF.

## 5. Mapa del repositorio

```
├── AGENTS.md / CLAUDE.md     # este contexto (CLAUDE.md solo lo importa)
├── README.md                 # descripción completa, metodología, reproducción
├── LICENSE                   # cesión de derechos al INE (Base Décimo primera)
├── requirements.txt          # pandas; shapely para el mapa; pillow y qrcode solo para imágenes
├── data/
│   ├── raw/                  # ZIP del INE (ignorados por git)
│   ├── fuentes/              # estados_natural_earth.geojson: límites estatales del mapa (dominio público)
│   └── processed/
│       ├── conteos_agregados.csv   # caché: año × entidad × tipo de sección × sexo × edad
│       ├── municipios.csv          # participación por municipio (se crea con --rehacer)
│       ├── evidencia_mitos.json    # cifras con que se evalúa cada mito
│       └── hallazgos.md            # tabla de mitos, decisiones y umbrales
├── docs/guia-facilitacion.md # taller de 20 minutos (fuente de site/guia.html)
├── scripts/
│   ├── procesar.py           # agrega, valida y genera los JSON del sitio
│   ├── procesar_atlas.py     # atlas: hallazgos por región (se detiene con HallazgoNoSostenido) y mapa
│   ├── procesar_chat.py      # chatbot: intenciones y plantillas (se detiene con ChatNoValido)
│   ├── probar_chat.js        # prueba del chatbot (Node), con docs/pruebas-chat.csv y pruebas-chat-lenguas.csv
│   ├── generar_guia.py       # convierte la guía a site/guia.html
│   ├── generar_imagenes.py   # vista previa para redes, QR e íconos
│   └── recursos/             # Lexend TTF para las imágenes
├── site/                     # sitio estático publicado
│   ├── index.html            # todas las pantallas del juego
│   ├── imprimible.html       # tarjetas tamaño carta (frente y reverso)
│   ├── guia.html             # guía generada, no se edita a mano
│   ├── sw.js / manifest.webmanifest   # sin conexión
│   ├── css/                  # estilos.css, atlas.css (prefijo at-) e imprimible.css
│   ├── js/textos.js          # textos que arma JavaScript
│   ├── js/lenguas.js         # náhuatl, maya y tseltal (BORRADOR sin revisar por hablantes): ?lengua=
│   ├── js/datos.js           # rutas de datos y edición por estado (?entidad=)
│   ├── js/juego.js           # flujo, perfil, revelación, resultado en 4 pasos, tarjeta
│   ├── js/caso.js            # «Y en tu caso…»
│   ├── js/personal.js        # datos por estado; respaldo edad → grupo → país
│   ├── js/combobox.js        # buscador accesible de estado y municipio
│   ├── js/graficas.js        # gráficas SVG accesibles
│   ├── js/voz.js             # lectura en voz alta
│   ├── js/mascota.js         # mascota «Boleta» (SVG decorativo) y confeti
│   ├── js/explorar.js        # pantalla Mapa: pestañas y «Explorar» (filtros, panel, buscador, tablas ordenables)
│   ├── js/atlas.js           # pestaña «Recorrido por regiones»; carga atlas.json y mapa.json para las dos
│   ├── js/mapa.js            # Mapa.crear(): mapa SVG con zoom, teclado (flechas) y escala de 5 tonos
│   ├── js/chat-motor.js / chat.js   # «Pregúntale a Boleta»: motor sin DOM; botón flotante y ventana (dialog)
│   ├── js/chat-lenguas.js    # el chatbot en náhuatl, maya y tseltal (BORRADOR sin revisar por hablantes)
│   ├── js/imprimible.js
│   ├── data/                 # mitos.json, explora.json, entidades.json, atlas.json, mapa.json, chat.json, entidad/<clave>/
│   └── fonts/, img/
└── .github/workflows/pages.yml   # publicación en GitHub Pages
```

Constantes clave en `procesar.py`: `ANIOS`, `PROXIMA_ELECCION` (junio de 2027), `UMBRAL_LISTA_NOMINAL` (1,000 personas por celda), `EMPATE_PUNTOS` (1 punto).

### Comandos

```bash
pip install -r requirements.txt
python scripts/procesar.py                # regenera site/data/ desde el agregado (sin ZIP)
python scripts/procesar.py --rehacer      # vuelve a leer los ZIP de data/raw/ (1 a 2 min)
python scripts/procesar.py --entidad 24   # edición de San Luis Potosí (clave INE 1–32)
python scripts/procesar_atlas.py          # atlas: site/data/atlas.json y mapa.json
python scripts/procesar_chat.py           # chatbot: site/data/chat.json (después de procesar.py y procesar_atlas.py)
node scripts/probar_chat.js               # prueba del chatbot; falla si una pregunta cae en otra intención
python scripts/generar_guia.py            # tras editar docs/guia-facilitacion.md
python -m http.server 8000 --directory site   # abrir http://localhost:8000
```

Si un mito deja de sostenerse, el script se detiene y explica por qué con cifras: no lo «arregles» cambiando el veredicto; avisa al equipo. En `--entidad`, el mito se omite para ese estado y la consola lo explica.

## 6. Cómo trabajar en equipo

- **Una rama por tarea y pull requests pequeños** hacia `main`. Lo que llega a `main` se publica solo.
- **Commits en español**, en el estilo del historial: una frase que describe el cambio, con mayúscula inicial y sin punto final (por ejemplo, «Perfil compacto: estado y municipio con búsqueda accesible (combobox)»). Si hace falta, un cuerpo breve con el porqué.
- **Antes de abrir un PR:**
  1. Ejecuta `python scripts/procesar.py` (y `--entidad 24` y `--entidad 6` si tocaste los datos) y revisa que no cambien cifras sin querer.
  2. Recorre el juego completo en un ancho de celular (390 px), con letra normal y con **A++**: sin scroll lateral y con un solo botón primario por pantalla.
  3. Activa **Voz** y verifica que lea la pregunta, la revelación y cada paso del resultado.
  4. Prueba con teclado y con «Prefiero no decir».
  5. Si agregaste archivos al sitio, añádelos a `ARCHIVOS` en `site/sw.js`.
- No subas los ZIP del INE, archivos de más de 50 MB ni la convocatoria.

## 7. Estado actual

**Hecho** (ver `git log`):
- Datos y validación: 8 mitos binarios verificados en las 6 elecciones; datos por estado y por municipio con umbral de celdas pequeñas.
- Juego: identidad de boleta, 3 niveles con arco narrativo, perfil con edad, estado y municipio, «Y en tu caso…», «Adivina antes de ver», pictograma, historia como votante, compromiso, tarjeta PNG con QR, reto entre generaciones.
- Kit: modo salón, versión imprimible, pantalla «Para talleres», guía de facilitación, versión por estado (demo principal San Luis Potosí, `?entidad=24`, 8 de 8 mitos; segunda demo Colima, `?entidad=6`, 4 de 8), funciona sin conexión.
- Ronda «reducir la saturación visual»: encabezado con panel «Aa», portada con una acción, perfil compacto, revelación en secuencia, resultado en 4 pasos, limpieza visual y documentación. Incluye «Adivina antes de ver» en una pantalla y barras con etiqueta en el mismo renglón cuando hay más de 8 categorías.
- Voz: solo voces locales (`localService`), ordenadas de la mejor a la peor; la persona puede elegir otra en «Aa» (solo en memoria). No uses voces en línea: mandarían el texto, que puede incluir el estado o la edad, a Microsoft o Google. La mascota mueve la boca mientras suena la voz (clase `voz-hablando` en `<html>`), salvo con «reducir movimiento».
- Mascota «Boleta» (PR #1): se asoma en cada pregunta, reacciona al sello y festeja el resultado; la cifra clave cuenta hasta su valor. Es decorativa (`aria-hidden`) y se detiene con «reducir movimiento». Revisada a 390 px, normal y A++: sin scroll lateral y sin tapar texto.
- «Adivina antes de ver»: una estimación exacta dice «¡Le atinaste!»; a 3 puntos o menos, «¡Casi le atinas!».
- **Juego y mapa con el mismo peso** (rama `juego-y-mapa`): portada con dos puertas; navegación Inicio · Juego · Mapa · Cómo se calcula (abajo en el celular, arriba en escritorio) con direcciones `#inicio`, `#juego`, `#mapa?…`, `#metodo` y botón Atrás; pantalla Mapa con «Explorar» (elección, indicador y grupo; panel con frase en «de cada 100», evolución, municipio, Escuchar, «Ponte a prueba» y «Copiar enlace») y «Recorrido por regiones»; «Ver esto en el mapa» en cada respuesta e invitación al mapa en el resultado; pantalla «Cómo se calcula» compartida. Los grupos de edad del atlas son los de los mitos (18, 18–29, 60–69, 85+). «Explora los datos» se integró al mapa. Voz no se ofrece si no hay una voz local en español. Revisado a 390, 768 y 1536 px, normal y A++; axe sin fallas en portada, Explorar, Recorrido y Cómo se calcula.
- «Y en tu caso…» visible: con perfil, la figura de la revelación abre en el dato de la persona. El municipio aparece solo en intermedias y tendencia (lo único que responde su participación total); la comparación la calcula `procesar.py` en `municipios.json`.

- **Lenguas indígenas (borrador, rama `lenguas-indigenas`):** selector en «Aa» con náhuatl, maya y tseltal, las tres con más hablantes (INEGI, Censo 2020). Traducción preliminar hecha con IA, **sin revisar por hablantes**; la página lo avisa siempre. Traduce portada, navegación, instrucciones, perfil, las 8 frases y sus explicaciones, «Y en tu caso…», el resultado, el mapa y el recorrido (rama `lenguas-completas`; si una cifra no coincide con la plantilla, ese texto se queda en español); la guía y el imprimible siguen en español; Voz se apaga en esas lenguas. Antes de usarla con comunidades debe revisarla una persona hablante de cada lengua.

- **Verificación final** (27 oct. 2026, a 390 px, recorriendo el juego completo con un script en el navegador):
  - Alturas (normal / A++): pregunta 844–1076 / 1070–1881 px; revelación 1785–2146 / 2900–3820 px; resultado 844–1054 / 962–1741 px. Un solo botón primario por pantalla, botones de al menos 44 px y sin scroll lateral en A, A+ y A++, en español, náhuatl, maya y tseltal.
  - Corregido: con A+ y A++ las tablas de «Ver los datos en una tabla» se cortaban a la derecha (`main` recorta lo que sobra); ahora se ponen guiones y los encabezados se parten. Voz no leía la nota de la gráfica en «Más contexto»; ya la lee.
  - Probado: reto desde la edición nacional, San Luis Potosí y Colima (el enlace solo lleva `entidad` y `reto`); modo salón con clic y teclado (→, ←, Esc); imprimible en las tres ediciones; «Para talleres»; «Explorar» y «Recorrido»; sin conexión con el servidor apagado (juego, perfil y mapa); festejo de la mascota con 4 de 8 y saludo con 3 de 8; Voz con voz local en pregunta, revelación y los 4 pasos del resultado.

- «Pregúntale a Boleta» (rama `chatbot-boleta`): chatbot sin LLM por intenciones, en un botón flotante abajo a la izquierda que abre una ventana modal (se sube sobre la navegación inferior y la barra de «Siguiente pregunta», y no aparece en el modo salón). En náhuatl, maya o tseltal (rama `chatbot-lenguas`, `site/js/chat-lenguas.js`, borrador con IA como `lenguas.js`) la ventana y las respuestas van en esa lengua y entiende preguntas en esa lengua y en español; una respuesta sin plantilla traducida sale en español con `lang="es"`. Para mejorarlo, lo más útil es que hablantes agreguen preguntas de ejemplo como las escribiría la gente. Para mejorar una respuesta, agrega preguntas de ejemplo o sinónimos en `procesar_chat.py` y una fila en `docs/pruebas-chat.csv`; nunca escribas cifras en las plantillas, solo `{datos}` que calcula `chat-motor.js` con `atlas.json` y `mitos.json`.

**En curso:**
- Auditoría con axe de la versión actual (no se corrió en esta ronda: hace falta cargar axe-core).
- Entregables fuera del repositorio (sección 9).

## 8. Ideas de mejora para explorar

*Propuestas, no decisiones.* Ninguna está aprobada.

- **Traducción a lenguas indígenas (maya y náhuatl primero)**, con hablantes de cada lengua. Lleva el mensaje a comunidades que casi nunca reciben materiales cívicos en su lengua; los textos ya están separados en `textos.js`, `index.html` y `procesar.py`.
- **Videos en Lengua de Señas Mexicana** por frase y explicación. Para muchas personas sordas el español escrito es segunda lengua; LSM vuelve el juego realmente inclusivo.
- **Pruebas con personas reales:** jóvenes de 18 a 29 años, personas mayores y alguien que use lector de pantalla. Le da al jurado evidencia en lugar de supuestos y encuentra fallas que no vemos. Para registrar sin datos personales:
  - solo tareas («terminó el juego: sí/no», «encontró Voz: sí/no»), tiempo aproximado, rango de edad amplio y citas anónimas;
  - sin nombres, fotos ni grabaciones;
  - consentimiento verbal;
  - resultados en una tabla en `docs/`, sin inventar ni completar datos.
- **Más versiones estatales:** generar y revisar las 32 con `--entidad` y priorizar los estados de las Juntas que puedan usarlo. Multiplica el alcance institucional con el mismo código.
- **Reporte de mitos por estado:** una tabla generada por `procesar.py` con qué mitos se sostienen u omiten en cada entidad. Ayuda a cada Junta Local a saber qué frases conversar y es un hallazgo en sí mismo (como el caso de Colima).
- **Comprobaciones automáticas en el workflow:** un script que falle si aparece `localStorage`, `sessionStorage`, `document.cookie` o una petición a otro dominio, y otro que mida alturas a 390 px y corra axe. Protege las reglas de privacidad y de «una pantalla, una idea» en cada PR sin depender de revisiones manuales.
- **Edición por distrito electoral:** la CCPC trae distrito federal y local; un `--distrito` similar a `--entidad` daría a las Juntas Distritales sus propios datos, con el mismo umbral de celdas pequeñas.
- **Preparar la actualización de 2027:** documentar paso a paso qué hacer cuando el INE publique los conteos de la intermedia de 2027 (agregar el ZIP, `ANIOS`, `PROXIMA_ELECCION`). Mantiene vivo el kit después del hackatón.

**Instrucción para la IA que lea este archivo:** antes de implementar cualquier idea nueva (de esta lista o propia), proponla al equipo con su alcance y espera la aprobación. No la implementes por iniciativa propia.

## 9. Entregables fuera del repositorio

Que nadie los olvide (fecha límite: 31 de octubre de 2026, 23:59):

- [ ] **Presentación ejecutiva**, máximo 10 diapositivas.
- [ ] **Guion narrativo**, de 3 a 5 cuartillas, en PDF.
- [ ] **Video** de máximo 3 minutos, MP4, 1080p.
- [ ] **Carta de cesión de derechos**, firmada.
- [ ] **Carta declaratoria**, firmada.
- [ ] Todo en un **.zip con el nombre del equipo y el eje**.

Revisa los requisitos exactos en la convocatoria (`Convocatoria_Hackaton.pdf`, fuera de git) antes de enviar.
