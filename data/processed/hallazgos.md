# Hallazgos: Mitos vs. Datos

Fuente: INE, Conteos Censales de Participación Ciudadana (CCPC) 2009–2024, datos abiertos.
Cifras generadas con `python scripts/procesar.py` (detalle completo en `evidencia_mitos.json`).

## Notas de método

- **Participación = Sí votaron / (Sí votaron + No votaron)**, igual que la plataforma CCPC. Los registros "no especificados" (NS) se excluyen.
- NS por año (% de la lista nominal): 2009 2.4 · 2012 0.2 · 2015 6.1 · 2018 6.8 · 2021 4.3 · 2024 6.4.
- La CCPC **no incluye** casillas especiales ni voto desde el extranjero, así que sus cifras difieren de los cómputos distritales oficiales. El sitio debe aclararlo.
- Las elecciones son federales: presidenciales 2012, 2018, 2024; intermedias 2009, 2015, 2021.
- Hay edades registradas de hasta 140 años (registros atípicos); 100+ años es como máximo el 0.06% de la lista nominal. Los grupos de 85+ años son el 1.0–1.3% de la lista nominal.
- Variables disponibles en cada año: entidad, municipio, distrito federal y local, sección, **tipo de sección (urbana/mixta/rural)**, sexo, edad simple, y los conteos LN, SV, NV y NS. "No binario" existe solo en 2024 (105 registros) y no se usa en las comparaciones por sexo.
- No disponible en los datos abiertos: población indígena/afromexicana (el tablero de la CCPC sí tiene ese filtro, pero los CSV no traen la variable).

## Tabla de mitos

| # | Mito | Evidencia clave | Elección / año | Veredicto propuesto |
|---|------|-----------------|----------------|---------------------|
| 1 | "Los jóvenes no votan." | 18–29 años: 49.1% votó en 2024 (11.9 millones de personas); 54.0% en 2018. Sí votan menos que quienes tienen 30 o más (63.5% en 2024). | 2009–2024; dato principal 2024 | **Falso** |
| 2 | "A los 18 años nadie vota; ya que crecen, empiezan a votar." | A los 18 años se vota **más que el promedio nacional** en las 6 elecciones (2024: 61.5% vs. 59.7%). La participación baja hasta los 23–26 años (2024: mínimo de 46.9% a los 25) y luego sube. | 2009–2024; dato principal 2024 | **Falso** |
| 3 | "Los hombres votan más que las mujeres." | Las mujeres votan más en las 6 elecciones: 64.2% vs. 54.8% en 2024 (9.4 puntos; de 7 a 8 puntos en los demás años). Solo a partir de los 70 años los hombres votan más. | 2009–2024; dato principal 2024 | **Falso** |
| 4 | "En las intermedias vota casi la misma gente que en las presidenciales." | Presidenciales: 62.1 / 62.4 / 59.7%. Intermedias: 44.1 / 47.1 / 51.8%. La diferencia va de 8 a 18 puntos. | 2009–2024 | **Falso** |
| 5 | "En el campo se vota menos que en la ciudad." | Las secciones rurales votan igual o más que las urbanas en todos los años: 2021 rural 58.4% vs. urbana 50.1%. En 2024 casi empatan (60.1% vs. 59.9%), y si los NS se cuentan como no votantes, urbana queda 0.5 puntos arriba. | 2009–2024; dato principal 2021 y 2024 | **Falso** (en 2024, empate) |
| 6 | "La participación en México va en picada desde 2009." | 2009 tuvo la participación **más baja** de la serie (44.1%). Sube y baja entre intermedias y presidenciales; las intermedias suben cada vez (44.1 → 47.1 → 51.8%). 2024 tuvo el número más alto de votantes (54.9 millones). La presidencial de 2024 quedó 2.7 puntos debajo de la de 2018. | 2009–2024 | **Falso** |
| 7 | "Todos los estados votan más o menos igual." | Entre el estado que más vota y el que menos hay de 24 a 41 puntos. 2024: Yucatán 71.4% vs. Baja California 47.0%. | 2009–2024; dato principal 2024 | **Falso** |
| 8 | "Las personas mayores son las que menos votan." | De 60 a 79 años están los grupos que **más** votan (65–69 años: 76.5% en 2024). Desde los 85 años la participación cae a 44.7% (85 años o más, juntos), la más baja de todos los grupos, pero ese grupo es apenas el 1.3% de la lista nominal. | 2009–2024; dato principal 2024 | **Parcialmente cierto** |

### Mitos nuevos que propongo (encontrados en los datos)

| # | Mito | Evidencia clave | Elección / año | Veredicto propuesto |
|---|------|-----------------|----------------|---------------------|
| 9 | "Los estados que más votan son siempre los mismos." | En parte: Yucatán quedó en 1.º o 2.º lugar en 5 de 6 elecciones y Baja California entre los 3 últimos en las 6. Pero hay cambios grandes: Tlaxcala pasó del lugar 28 (2015) al 1 (2021). | 2009–2024 | **Parcialmente cierto** |
| 10 | "La diferencia entre mujeres y hombres es igual a todas las edades." | La brecha más grande está entre los 30 y 39 años (13.5–13.7 puntos en 2024), casi desaparece a los 65–69 y se invierte desde los 70. | 2024 (se repite en todos los años) | **Falso** |
| 11 | "Las personas de 60 a 74 años son las que más votan." | El grupo con mayor participación es 60–64 o 65–69 en las 6 elecciones (2024: 65–69 años, 76.5%). | 2009–2024 | **Cierto** |

## Mitos descartados

Ninguno de los candidatos tuvo que descartarse: los 8 pueden responderse con estos datos (el 5 sí se puede porque existe la variable de tipo de sección).

## Decisión final (aprobada)

Mitos que entran al juego: **1, 2, 3, 4, 5, 6, 8 y 11**. Veredictos: 1 Falso, 2 Falso, 3 Falso, 4 Falso, 5 Falso, 6 Falso, 8 Parcialmente cierto, 11 Cierto.
Quedan fuera del juego: 7, 9 y 10 (su evidencia se conserva arriba). El 7 sigue disponible en la sección "Explora los datos" (participación por estado).

`scripts/procesar.py` revisa que los datos sigan sosteniendo cada veredicto aprobado y se detiene si alguno deja de cumplirse.
