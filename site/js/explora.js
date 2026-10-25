/*
 * Sección "Explora los datos": dos gráficas filtrables por año y estado.
 */
const Explora = (() => {
  const $ = (sel) => document.querySelector(sel);
  const E = TEXTOS.explora;
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
    $("#f-entidad").innerHTML = `<option value="0">${E.todoPais}</option>` +
      edad.entidades.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join("");

    $("#f-anio-edad").addEventListener("change", porEdad);
    $("#f-entidad").addEventListener("change", () => { porEdad(); porEstado(); });
    $("#f-anio-estado").addEventListener("change", porEstado);
  }

  function porEdad() {
    const anio = $("#f-anio-edad").value;
    const clave = $("#f-entidad").value;
    const { edad } = datos;
    const nombre = clave === "0" ? E.todoPais
      : edad.entidades.find((e) => String(e.clave) === clave).nombre;
    const series = [{ nombre, valores: edad.datos[anio][clave], color: "datos" }];
    if (clave !== "0") series.push({ nombre: E.todoPais, valores: edad.datos[anio]["0"], color: "base" });
    const spec = {
      tipo: "linea",
      titulo: E.tituloEdad(nombre, anio),
      x: edad.grupos,
      x_titulo: E.ejeEdad,
      series,
    };
    Graficas.dibujar($("#e-edad"), spec);
    $("#e-edad-tabla").replaceChildren(Graficas.tabla(spec));
    $("#e-edad-fuente").textContent = E.fuente(anio);
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
    items.push({ etiqueta: E.promedioNacional, valor: entidades.nacional[anio], color: "base" });
    items.sort((a, b) => b.valor - a.valor);
    const spec = {
      tipo: "barras",
      compacto: true,
      titulo: E.tituloEstados(anio),
      items,
    };
    Graficas.dibujar($("#e-estado"), spec);
    $("#e-estado-tabla").replaceChildren(Graficas.tabla(spec));
    $("#e-estado-fuente").textContent = E.fuente(anio);
  }

  async function abrir() {
    try {
      if (!datos) await cargar();
      porEdad();
      porEstado();
    } catch {
      $("#e-edad").textContent = E.error;
    }
  }

  return { abrir };
})();
