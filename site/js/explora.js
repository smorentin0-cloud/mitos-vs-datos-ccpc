/*
 * Pantalla "Ver los datos", con dos pestañas:
 * «Explora los datos» (dos gráficas filtrables por año y estado) y «Atlas de la participación» (atlas.js).
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

  async function abrirGraficas() {
    try {
      if (!datos) await cargar();
      porEdad();
      porEstado();
    } catch {
      $("#e-edad").textContent = E.error;
    }
  }

  // ---------- pestañas (patrón ARIA: flechas, Inicio y Fin cambian de pestaña)

  const pestanas = [...document.querySelectorAll("#explora .pestana")];

  function elegirPestana(tab, enfocar = false) {
    pestanas.forEach((t) => {
      const activa = t === tab;
      t.setAttribute("aria-selected", String(activa));
      t.tabIndex = activa ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !activa;
    });
    if (enfocar) tab.focus();
    // El atlas usa todo el ancho de la pantalla; las gráficas, la columna del juego.
    document.body.classList.toggle("con-atlas", tab.id === "tab-atlas");
    if (tab.id === "tab-atlas") Atlas.abrir();
    else {
      Atlas.cerrar();
      abrirGraficas();
    }
  }

  pestanas.forEach((t, i) => {
    t.addEventListener("click", () => elegirPestana(t));
    t.addEventListener("keydown", (e) => {
      const n = pestanas.length;
      const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      elegirPestana(pestanas[destino], true);
    });
  });

  // Al entrar a la pantalla se abre la pestaña que estaba elegida.
  function abrir() {
    elegirPestana(pestanas.find((t) => t.getAttribute("aria-selected") === "true"));
  }

  // Al salir de la pantalla: el atlas deja de observar el scroll y la columna vuelve a su ancho.
  function cerrar() {
    Atlas.cerrar();
    document.body.classList.remove("con-atlas");
  }

  return { abrir, cerrar };
})();
