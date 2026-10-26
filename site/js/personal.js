/*
 * Datos de la persona: viven solo en memoria. Los archivos personal.json (uno por estado y el del país)
 * se descargan cuando hacen falta. Las cifras vienen de scripts/procesar.py; aquí solo se eligen.
 */
const Personal = (() => {
  const archivos = {};

  async function cargar(clave) {
    const k = String(clave);
    if (!archivos[k]) {
      archivos[k] = fetch(`data/entidad/${k}/personal.json`).then((r) => {
        if (!r.ok) throw new Error(`Sin datos para la clave ${k}`);
        return r.json();
      });
    }
    return archivos[k];
  }

  const anioActual = () => new Date().getFullYear();
  // Edad aproximada en una elección pasada, a partir de la edad de hoy.
  const edadEn = (edad, anio) => edad - (anioActual() - anio);

  function indiceEdad(p, edad) {
    return Math.min(edad, 85) - 18; // las edades van de 18 a 84 y al final «85+»
  }

  function indiceGrupo(p, edad) {
    if (edad < 20) return 0;
    return Math.min(Math.floor((edad - 20) / 5) + 1, p.grupos.length - 1);
  }

  /*
   * Participación de una edad en un lugar y año. Si la celda quedó bajo el umbral de lista nominal,
   * usa el grupo quinquenal y, si tampoco hay, el dato del país. `nivel` dice cuál se usó.
   */
  function participacionEdad(local, pais, anio, edad) {
    const a = String(anio);
    const e = Math.max(edad, 18);
    const i = indiceEdad(local, e);
    const g = indiceGrupo(local, e);
    if (local.por_edad[a][i] != null) return { valor: local.por_edad[a][i], nivel: "edad", lugar: local.nombre, edad: e };
    if (local.por_grupo[a][g] != null) return { valor: local.por_grupo[a][g], nivel: "grupo", lugar: local.nombre, edad: e, grupo: local.grupos[g] };
    const v = pais.por_edad[a][i] ?? pais.por_grupo[a][g];
    return { valor: v, nivel: "pais", lugar: pais.nombre, edad: e };
  }

  // Elecciones de esta historia (2009–2024) en las que la persona ya tenía 18 años.
  function eleccionesVividas(edad, anios) {
    return anios.filter((a) => edadEn(edad, a) >= 18);
  }

  // Primera elección federal en la que tendrá 18 años, contando desde la próxima.
  function primeraEleccion(edad, proxima) {
    let anio = proxima.anio;
    while (edad + (anio - anioActual()) < 18) anio += proxima.cada_cuantos_anios;
    return anio;
  }

  return { cargar, anioActual, edadEn, participacionEdad, eleccionesVividas, primeraEleccion, indiceGrupo };
})();
