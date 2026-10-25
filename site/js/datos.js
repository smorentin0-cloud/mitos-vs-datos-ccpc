/*
 * Rutas de los datos que genera scripts/procesar.py.
 * Con ?entidad=<clave> (p. ej. index.html?entidad=6) se usa el juego de ese estado,
 * generado con: python scripts/procesar.py --entidad <clave>
 */
const Datos = (() => {
  const NACIONAL = "data/mitos.json";
  const valor = new URLSearchParams(location.search).get("entidad");
  const entidad = /^\d{1,2}$/.test(valor || "") ? Number(valor) : null;

  // Agrega ?entidad=<clave> a un enlace interno para no perder la versión estatal al navegar.
  function conEntidad(ruta) {
    return entidad ? `${ruta}?entidad=${entidad}` : ruta;
  }

  // Si el estado pedido no tiene su versión generada, se usa la nacional.
  async function mitos() {
    if (entidad) {
      try {
        const r = await fetch(`data/entidad/${entidad}/mitos.json`);
        if (r.ok) return { datos: await r.json(), respaldo: false };
      } catch { /* sin versión estatal: sigue con la nacional */ }
    }
    const r = await fetch(NACIONAL);
    return { datos: await r.json(), respaldo: Boolean(entidad) };
  }

  return { entidad, conEntidad, mitos };
})();
