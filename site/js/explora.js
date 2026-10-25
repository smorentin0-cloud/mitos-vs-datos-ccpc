/*
 * Sección "Explora los datos": dos gráficas filtrables por año y estado.
 */
const Explora = (() => {
  const $ = (sel) => document.querySelector(sel);
  const fuente = (anio) => `Fuente: INE, Conteos Censales de Participación Ciudadana, ${anio}.`;
  let datos = null;

  async function cargar() {
    const [edad, entidades] = await Promise.all([
      fetch("data/explora.json").then((r) => r.json()),
      fetch("data/entidades.json").then((r) => r.json()),
    ]);
    datos = { edad, entidades };

    const opcionesAnio = edad.anios.slice().reverse()
      .map((a) => `<option value="${a}">${a}</option>`).join("");
    $("#f-anio-edad").innerHTML = opcionesAnio;
    $("#f-anio-estado").innerHTML = opcionesAnio;
    $("#f-entidad").innerHTML = `<option value="0">Todo el país</option>` +
      edad.entidades.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join("");

    $("#f-anio-edad").addEventListener("change", porEdad);
    $("#f-entidad").addEventListener("change", () => { porEdad(); porEstado(); });
    $("#f-anio-estado").addEventListener("change", porEstado);
  }

  function porEdad() {
    const anio = $("#f-anio-edad").value;
    const clave = $("#f-entidad").value;
    const { edad } = datos;
    const nombre = clave === "0" ? "Todo el país"
      : edad.entidades.find((e) => String(e.clave) === clave).nombre;
    const series = [{ nombre, valores: edad.datos[anio][clave], color: "datos" }];
    if (clave !== "0") series.push({ nombre: "Todo el país", valores: edad.datos[anio]["0"], color: "base" });
    const spec = {
      tipo: "linea",
      titulo: `Participación por grupo de edad: ${nombre}, ${anio}`,
      x: edad.grupos,
      x_titulo: "Grupo de edad (años)",
      series,
    };
    Graficas.dibujar($("#e-edad"), spec);
    $("#e-edad-tabla").replaceChildren(Graficas.tabla(spec));
    $("#e-edad-fuente").textContent = fuente(anio);
  }

  function porEstado() {
    const anio = $("#f-anio-estado").value;
    const clave = Number($("#f-entidad").value);
    const { entidades } = datos;
    const items = entidades.entidades.map((e, i) => ({
      etiqueta: e.nombre,
      valor: entidades.participacion[anio][i],
      color: e.clave === clave ? "acento" : "datos",
    }));
    items.push({ etiqueta: "Promedio nacional", valor: entidades.nacional[anio], color: "base" });
    items.sort((a, b) => b.valor - a.valor);
    const spec = {
      tipo: "barras",
      compacto: true,
      titulo: `Participación por estado, ${anio}`,
      items,
    };
    Graficas.dibujar($("#e-estado"), spec);
    $("#e-estado-tabla").replaceChildren(Graficas.tabla(spec));
    $("#e-estado-fuente").textContent = fuente(anio);
  }

  async function abrir() {
    try {
      if (!datos) await cargar();
      porEdad();
      porEstado();
    } catch {
      $("#e-edad").textContent = "No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.";
    }
  }

  return { abrir };
})();
