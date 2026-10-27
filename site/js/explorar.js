/*
 * Pantalla «Mapa», con dos pestañas: «Explorar» (libre: filtros, mapa, panel del estado o municipio y tablas)
 * y «Recorrido por regiones» (atlas.js). Todo lo del mapa se puede hacer sin el mapa: lista de estados,
 * buscador de municipio y tablas ordenables con los mismos datos.
 * La vista (elección, indicador y grupo) va en la URL (#mapa?anio=…); el estado solo entra al copiar el enlace.
 * El perfil del juego (edad, estado) se lee en memoria y nunca va en la URL.
 */
const Explorar = (() => {
  const $ = (s) => document.querySelector(s);
  const T = () => TEXTOS.explorar;
  const pct1 = (v) => (v == null ? "—" : v.toFixed(1));
  let atlas, porClave, mapa, comboMun, cortes, armado = false;
  let municipios = null;
  let zoomPais = false;
  const vista = { anio: null, ver: "total", grupo: null, estado: null, municipio: null };
  let leerPerfil = () => null;
  let alJugar = () => {};
  let alCambiar = () => {};

  // ---------- datos de la vista

  const grupos = (ver) => ({ edad: ["18", ...atlas.grupos_edad], sexo: atlas.sexos, seccion: atlas.secciones }[ver] || []);

  // Valor del indicador elegido para un estado o para el país (atlas.nacional), en un año.
  function valor(ambito, anio = vista.anio) {
    if (vista.ver === "total") return ambito.participacion[anio];
    const d = ambito.detalle[anio];
    if (vista.ver === "edad") return vista.grupo === "18" ? d.edad_18 : d.edad[atlas.grupos_edad.indexOf(vista.grupo)];
    return d[vista.ver][grupos(vista.ver).indexOf(vista.grupo)];
  }

  const quien = () => (vista.ver === "total" ? T().quien.total : T().quien[vista.ver][vista.grupo]);
  const presidencial = (a) => atlas.presidenciales.includes(Number(a));
  const diferencia = (v, n) => (v == null || n == null ? null : Math.round(v) - Math.round(n));

  // Lugar del estado entre los que tienen dato (1 = el que más votó).
  function lugar(clave) {
    const orden = atlas.estados.map((e) => [e.clave, valor(e)]).filter(([, v]) => v != null).sort((a, b) => b[1] - a[1]);
    return { n: orden.findIndex(([c]) => c === clave) + 1, total: orden.length };
  }

  // ---------- URL: solo la vista; el estado, solo si la persona copia el enlace

  function consulta(conEstado = false) {
    const q = new URLSearchParams({ anio: vista.anio, ver: vista.ver });
    if (vista.grupo) q.set("grupo", vista.grupo);
    if (conEstado && vista.estado) q.set("estado", vista.estado);
    return q.toString();
  }

  function aplicarConsulta(q) {
    if (!q) return;
    const anio = q.get("anio");
    if (atlas.anios.map(String).includes(anio)) vista.anio = anio;
    const ver = q.get("ver");
    if (["total", "edad", "sexo", "seccion"].includes(ver)) {
      vista.ver = ver;
      const g = q.get("grupo");
      vista.grupo = ver === "total" ? null : grupos(ver).includes(g) ? g : grupos(ver)[0];
    }
    const estado = Number(q.get("estado"));
    if (porClave[estado]) elegirEstado(estado, false);
  }

  // ---------- armado (una vez)

  function opciones(select, pares) {
    select.replaceChildren(...pares.map(([v, t]) => new Option(t, v)));
  }

  function armar() {
    if (armado) return;
    armado = true;
    mapa = Mapa.crear($("#mx-mapa"), Atlas.geo(), atlas, { teclado: true });
    mapa.alElegir((clave) => elegirEstado(clave));
    mapa.alEnfocar((clave) => {
      const e = porClave[clave];
      const v = valor(e);
      $("#mx-enfocado").textContent = T().estadoNombre(e.nombre, v, diferencia(v, valor(atlas.nacional)));
    });

    opciones($("#mx-anio"), atlas.anios.slice().reverse().map((a) => [a, T().anio(a, presidencial(a))]));
    opciones($("#mx-ver"), Object.entries(T().ver));
    const nombres = atlas.estados.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    nombres.forEach((e) => $("#mx-estado").add(new Option(e.nombre, e.clave)));

    $("#mx-anio").addEventListener("change", (ev) => { vista.anio = ev.target.value; pintar(); });
    $("#mx-ver").addEventListener("change", (ev) => {
      vista.ver = ev.target.value;
      vista.grupo = vista.ver === "total" ? null : grupos(vista.ver)[0];
      pintar();
    });
    $("#mx-grupo").addEventListener("change", (ev) => { vista.grupo = ev.target.value; pintar(); });
    $("#mx-estado").addEventListener("change", (ev) => elegirEstado(Number(ev.target.value) || null));
    $("#mx-pais").addEventListener("click", () => { zoomPais = true; pintar(); });
    $("#mx-mi-estado").addEventListener("click", () => {
      const p = leerPerfil();
      if (p && p.entidad) elegirEstado(p.entidad);
    });
    $("#mx-mi-edad").addEventListener("click", verMiEdad);
    $("#mx-mas").addEventListener("click", () => {
      elegirPestana($("#tab-recorrido"));
      Atlas.verEstado(vista.estado);
    });
    $("#mx-ponte").addEventListener("click", () => alJugar());
    $("#mx-copiar").addEventListener("click", copiar);

    comboMun = Combobox.crear({
      input: $("#mx-municipio"), lista: $("#mx-municipio-lista"), ayuda: $("#mx-mun-ayuda"),
      opciones: () => (municipios ? municipios.municipios.map((m) => ({ valor: m.clave, texto: m.nombre })) : []),
      alElegir: (v) => { vista.municipio = v ? String(v) : null; pintarPanel(); },
      textos: T().municipio,
    });
  }

  async function elegirEstado(clave, enfocarPanel = true) {
    vista.estado = clave;
    vista.municipio = null;
    municipios = null;
    zoomPais = false;
    comboMun.limpiar();
    $("#mx-estado").value = clave || "";
    $("#mx-bloque-mun").hidden = true;
    $("#mx-tabla-mun-bloque").hidden = true;
    pintar();
    if (!clave) return;
    if (enfocarPanel) $("#mx-p-titulo").focus({ preventScroll: false });
    const datos = await Personal.cargarMunicipios(clave);
    if (!datos || vista.estado !== clave) return;
    municipios = datos;
    $("#mx-bloque-mun").hidden = false;
    pintarTablaMunicipios();
  }

  // «Mi grupo de edad»: el grupo de la edad que la persona tenía en la elección elegida.
  function verMiEdad() {
    const p = leerPerfil();
    if (!p || p.edad == null) return;
    const edad = Personal.edadEn(p.edad, Number(vista.anio));
    vista.ver = "edad";
    vista.grupo = edad <= 18 ? "18"
      : atlas.grupos_edad.find((g) => {
        const [d, h] = g.split("–").map(Number);
        return h ? edad >= d && edad <= h : edad >= parseInt(g, 10);
      });
    pintar();
  }

  // ---------- pintar

  function pintar() {
    if (!armado) return;
    $("#mx-anio").value = vista.anio;
    $("#mx-ver").value = vista.ver;
    const g = grupos(vista.ver);
    $("#mx-campo-grupo").hidden = vista.ver === "total";
    if (vista.ver !== "total") {
      opciones($("#mx-grupo"), g.map((x) => [x, T().grupos[vista.ver][x]]));
      $("#mx-grupo").value = vista.grupo;
    }

    // Escala del año elegido: así se notan las diferencias entre estados (la leyenda dice los rangos).
    cortes = Mapa.escala(atlas.estados.map((e) => valor(e)));
    const n = valor(atlas.nacional);
    const e = porClave[vista.estado];
    $("#mx-titulo").textContent = T().titulo(quien(), vista.anio);
    mapa.pintar({
      anio: vista.anio, valor: (x) => valor(x), cortes,
      estado: vista.estado, soloResaltar: true,
      encuadre: e && !zoomPais ? mapa.cajaRegion(e.region) : null,
      nombre: (x, v) => T().estadoNombre(x.nombre, v, diferencia(v, n)),
    });
    $("#mx-pais").hidden = !e || zoomPais;
    Mapa.leyenda($("#mx-leyenda"), cortes);
    $("#mx-enfocado").textContent = "";
    $("#mx-fuente").textContent = `${T().fuente(vista.anio)} ${atlas.metodo}`;

    const p = leerPerfil();
    $("#mx-mi-estado").hidden = !(p && p.entidad && p.entidad !== vista.estado);
    $("#mx-mi-estado").textContent = p && p.nombre ? TEXTOS.explorar.miEstado(p.nombre) : "";
    $("#mx-mi-edad").hidden = !(p && p.edad != null);

    pintarTablaEstados();
    pintarPanel();
    if (vista.municipio || municipios) pintarTablaMunicipios();
    alCambiar(consulta());
  }

  function pintarPanel() {
    const e = porClave[vista.estado];
    $("#mx-panel").hidden = !e;
    $("#mx-indicacion").hidden = !!e;
    if (!e) return;
    const anio = vista.anio;
    const v = valor(e);
    const n = valor(atlas.nacional);
    $("#mx-p-titulo").textContent = e.nombre;
    if (v == null) {
      $("#mx-p-frase").textContent = T().sinDato(e.nombre);
    } else {
      const l = lugar(e.clave);
      $("#mx-p-frase").textContent = `${T().frase(e.nombre, v, quien(), anio, n, T().delPais)} ${T().lugar(l.n, l.total)}`;
    }

    // Municipio: solo participación total, comparada con el promedio de su estado.
    const m = municipios && vista.municipio ? municipios.municipios.find((x) => String(x.clave) === vista.municipio) : null;
    const mun = $("#mx-p-mun");
    mun.hidden = !m;
    if (m) {
      const vm = m.participacion[anio];
      const ve = e.participacion[anio];
      mun.textContent = (vm == null ? T().munSinDato(m.nombre) : T().frase(m.nombre, vm, T().quien.total, anio, ve, T().deLugar(e.nombre)))
        + (vista.ver === "total" ? "" : ` ${T().soloTotal}`);
    }

    // Evolución: el estado frente al país en el indicador elegido; con municipio, el municipio frente a su estado.
    const anios = atlas.anios;
    const serie = m ? anios.map((a) => m.participacion[a]) : anios.map((a) => valor(e, a));
    const ref = m ? anios.map((a) => e.participacion[a]) : anios.map((a) => valor(atlas.nacional, a));
    const nombre = m ? m.nombre : e.nombre;
    const nombreRef = m ? e.nombre : TEXTOS.atlas.compara.nacional;
    $("#mx-p-g-t").textContent = T().tituloSerie(m ? T().quien.total : quien(), anios[0], anios.at(-1));
    if (serie.some((x) => x != null)) {
      GraficasAtlas.historia($("#mx-p-g"), { anios, estado: serie, pais: ref, nombre, nombreRef, anioActivo: anio });
    } else {
      $("#mx-p-g").replaceChildren();
    }
    GraficasAtlas.tabla($("#mx-p-t"), [TEXTOS.atlas.compara.colAnio, nombre, nombreRef],
      anios.map((a, i) => [a, pct1(serie[i]), pct1(ref[i])]));
  }

  // ---------- tablas ordenables

  const ordenes = {};

  /*
   * columnas: [{ titulo, numero }]; filas: [[{ texto, valor }]]. El orden vive en `ordenes[id]`.
   * Cada encabezado es un botón; aria-sort dice el orden actual.
   */
  function tablaOrdenable(contenedor, id, columnas, filas) {
    const o = ordenes[id] || (ordenes[id] = { col: 1, asc: false });
    const ordenadas = filas.slice().sort((a, b) => {
      const x = a[o.col].valor, y = b[o.col].valor;
      if (x == null) return 1;
      if (y == null) return -1;
      const r = typeof x === "string" ? x.localeCompare(y, "es") : x - y;
      return o.asc ? r : -r;
    });
    const t = document.createElement("table");
    t.className = "mx-tabla-datos";
    const cabeza = t.createTHead().insertRow();
    columnas.forEach((c, i) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.setAttribute("aria-sort", o.col === i ? (o.asc ? "ascending" : "descending") : "none");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mx-ordenar";
      b.innerHTML = `<span></span><span class="mx-flecha" aria-hidden="true">${o.col === i ? (o.asc ? "▲" : "▼") : "↕"}</span>`;
      b.firstChild.textContent = c.titulo;
      b.setAttribute("aria-label", T().ordenar(c.titulo));
      b.addEventListener("click", () => {
        ordenes[id] = { col: i, asc: o.col === i ? !o.asc : !c.numero };
        tablaOrdenable(contenedor, id, columnas, filas);
        contenedor.querySelectorAll(".mx-ordenar")[i].focus();
      });
      th.appendChild(b);
      cabeza.appendChild(th);
    });
    const cuerpo = t.createTBody();
    ordenadas.forEach((f) => {
      const r = cuerpo.insertRow();
      f.forEach((c, i) => {
        const celda = i === 0 ? document.createElement("th") : r.insertCell();
        if (i === 0) { celda.scope = "row"; r.appendChild(celda); }
        celda.textContent = c.texto;
      });
    });
    contenedor.replaceChildren(t);
  }

  const conSigno = (d) => (d == null ? "—" : d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1));

  function pintarTablaEstados() {
    const n = valor(atlas.nacional);
    $("#mx-tabla-resumen").textContent = T().tablaEstados;
    tablaOrdenable($("#mx-tabla"), "estados",
      [{ titulo: T().colEstado }, { titulo: T().colValor, numero: true }, { titulo: T().colDifCon(T().pais), numero: true }],
      atlas.estados.map((e) => {
        const v = valor(e);
        const d = v == null || n == null ? null : v - n;
        return [{ texto: e.nombre, valor: e.nombre }, { texto: pct1(v), valor: v }, { texto: conSigno(d), valor: d }];
      }));
  }

  function pintarTablaMunicipios() {
    const e = porClave[vista.estado];
    if (!municipios || !e) return;
    const ve = e.participacion[vista.anio];
    $("#mx-tabla-mun-bloque").hidden = false;
    $("#mx-tabla-mun-resumen").textContent = T().tablaMunicipios(e.nombre);
    $("#mx-tabla-mun-nota").textContent = vista.ver === "total" ? "" : T().soloTotal;
    tablaOrdenable($("#mx-tabla-mun"), "municipios",
      [{ titulo: T().colMunicipio }, { titulo: T().colValor, numero: true }, { titulo: T().colDifCon(e.nombre), numero: true }],
      municipios.municipios.map((m) => {
        const v = m.participacion[vista.anio];
        const d = v == null || ve == null ? null : v - ve;
        return [{ texto: m.nombre, valor: m.nombre }, { texto: pct1(v), valor: v }, { texto: conSigno(d), valor: d }];
      }));
  }

  // ---------- compartir la vista (aquí sí va el estado: la persona decide copiarlo)

  async function copiar() {
    const entidad = new URLSearchParams(location.search).get("entidad");
    const url = `${location.origin}${location.pathname}${entidad ? `?entidad=${entidad}` : ""}#mapa?${consulta(true)}`;
    const aviso = $("#mx-copiado");
    try {
      await navigator.clipboard.writeText(url);
      aviso.textContent = T().copiado;
    } catch {
      aviso.textContent = T().copiaManual(url);
    }
  }

  // ---------- pestañas (patrón ARIA: flechas, Inicio y Fin cambian de pestaña)

  const pestanas = [...document.querySelectorAll("#mapa .pestana")];

  function elegirPestana(tab, enfocar = false) {
    pestanas.forEach((t) => {
      const activa = t === tab;
      t.setAttribute("aria-selected", String(activa));
      t.tabIndex = activa ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !activa;
    });
    if (enfocar) tab.focus();
    if (tab.id === "tab-recorrido") Atlas.abrir();
    else {
      Atlas.cerrar();
      pintar();
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

  // ---------- entrada y salida de la pantalla

  /*
   * q: URLSearchParams de la URL (#mapa?…) o null; desde el juego: { anio, ver, grupo, estado }.
   * Se carga la primera vez (atlas.json y mapa.json, unos 90 KB).
   */
  async function abrir(q = null) {
    document.body.classList.add("con-atlas");
    try {
      ({ atlas } = await Atlas.datos());
    } catch {
      $("#mx-titulo").textContent = TEXTOS.atlas.error;
      return;
    }
    porClave = Object.fromEntries(atlas.estados.map((e) => [e.clave, e]));
    if (!vista.anio) vista.anio = String(atlas.ultimo);
    armar();
    if (q instanceof URLSearchParams) aplicarConsulta(q);
    else if (q) {
      aplicarConsulta(new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== "")));
      elegirPestana($("#tab-explorar"));
      return;
    }
    elegirPestana(pestanas.find((t) => t.getAttribute("aria-selected") === "true"));
  }

  function cerrar() {
    Atlas.cerrar();
    document.body.classList.remove("con-atlas");
  }

  function redibujar() {
    if (!armado || $("#mapa").hidden || $("#panel-explorar").hidden) return;
    pintar();
  }

  // Lo que se lee en voz alta: el panel del estado (o la indicación) o el paso activo del recorrido.
  function texto() {
    if (!$("#panel-recorrido").hidden) return Atlas.textoActivo();
    const partes = [$("#mx-titulo").textContent];
    if ($("#mx-panel").hidden) partes.push($("#mx-indicacion").textContent);
    else {
      partes.push($("#mx-p-titulo").textContent, $("#mx-p-frase").textContent);
      if (!$("#mx-p-mun").hidden) partes.push($("#mx-p-mun").textContent);
    }
    return partes.filter(Boolean).join(". ");
  }

  return {
    abrir, cerrar, redibujar, texto,
    consulta: () => (armado ? consulta() : ""),
    perfil: (fn) => { leerPerfil = fn; },
    alJugar: (fn) => { alJugar = fn; },
    alCambiar: (fn) => { alCambiar = fn; },
  };
})();
