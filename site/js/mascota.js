/*
 * «Boleta», la mascota del juego: una boleta con cara, dibujada en SVG sin imágenes externas.
 * Es decorativa (aria-hidden): toda la información sigue en el texto de cada pantalla.
 * Expresiones: saluda, piensa, celebra, sorpresa. Los colores salen de las variables de estilos.css.
 */
const Mascota = (() => {
  const mano = (x, y) => `<circle class="m-mano" cx="${x}" cy="${y}" r="3.2"/>`;
  const marca = '<path class="m-x" d="M44.5 66 L55.5 75 M55.5 66 L44.5 75"/>';

  const EXPRESIONES = {
    saluda: {
      brazos: `<path class="m-linea" d="M23 58 Q13 66 15 75"/>${mano(15, 77)}
        <g class="m-brazo-saluda"><path class="m-linea" d="M77 56 Q89 48 87 35"/>${mano(87, 32)}</g>`,
      cara: `<circle class="m-tinta" cx="41" cy="40" r="3.4"/><circle class="m-tinta" cx="59" cy="40" r="3.4"/>
        <path class="m-linea" d="M42 50 Q50 57 58 50"/>`,
      casilla: marca,
      extra: "",
    },
    piensa: {
      brazos: `<path class="m-linea" d="M23 58 Q13 66 15 75"/>${mano(15, 77)}
        <path class="m-linea" d="M77 58 Q90 55 85 45"/>${mano(84, 43)}`,
      cara: `<circle class="m-tinta" cx="43" cy="38" r="3"/><circle class="m-tinta" cx="61" cy="38" r="3"/>
        <path class="m-linea" d="M45 52 L56 50"/>`,
      casilla: "",
      extra: '<g class="m-signo"><path class="m-ambar" d="M81 8 Q81 2 87 2 Q93 2 93 8 Q93 12 87 14 L87 17"/><circle class="m-ambar-relleno" cx="87" cy="22" r="1.9"/></g>',
    },
    celebra: {
      brazos: `<path class="m-linea" d="M23 54 Q11 42 13 29"/>${mano(13, 26)}
        <path class="m-linea" d="M77 54 Q89 42 87 29"/>${mano(87, 26)}`,
      cara: `<path class="m-linea" d="M36 42 Q41 35 46 42"/><path class="m-linea" d="M54 42 Q59 35 64 42"/>
        <path class="m-tinta" d="M41 49 Q50 61 59 49 Z"/>`,
      casilla: marca,
      extra: '<path class="m-ambar m-chispa" d="M6 8 V18 M1 13 H11"/><path class="m-ambar m-chispa" d="M94 4 V14 M89 9 H99"/>',
    },
    sorpresa: {
      brazos: `<path class="m-linea" d="M23 56 Q11 54 8 45"/>${mano(7, 42)}
        <path class="m-linea" d="M77 56 Q89 54 92 45"/>${mano(93, 42)}`,
      cara: `<path class="m-linea" d="M36 30 Q41 27 46 30"/><path class="m-linea" d="M54 30 Q59 27 64 30"/>
        <circle class="m-tinta" cx="41" cy="40" r="4.2"/><circle class="m-tinta" cx="59" cy="40" r="4.2"/>
        <ellipse class="m-tinta" cx="50" cy="53" rx="3.6" ry="4.6"/>`,
      casilla: "",
      extra: '<path class="m-ambar" d="M88 2 V13"/><circle class="m-ambar-relleno" cx="88" cy="19" r="1.9"/>',
    },
  };

  function svg(expresion) {
    const e = EXPRESIONES[expresion] || EXPRESIONES.saluda;
    return `<svg class="mascota ${expresion}" viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <ellipse class="m-sombra" cx="50" cy="112" rx="24" ry="4"/>
      <path class="m-linea" d="M41 86 L39 104 L33 104 M59 86 L61 104 L67 104"/>
      ${e.brazos}
      <rect class="m-cuerpo" x="22" y="12" width="56" height="74" rx="5"/>
      <path class="m-perforado" d="M27 21 H73"/>
      ${e.cara}
      <rect class="m-casilla" x="40" y="62" width="20" height="17" rx="2"/>
      ${e.casilla}
      ${e.extra}
    </svg>`;
  }

  function poner(contenedor, expresion) {
    if (contenedor) contenedor.innerHTML = svg(expresion);
  }

  // Confeti breve de casillas marcadas. No se muestra con «reducir movimiento».
  function festejar() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const capa = document.createElement("div");
    capa.className = "confeti";
    capa.setAttribute("aria-hidden", "true");
    const formas = ["M3 3 L13 13 M13 3 L3 13", "M2 8.5 L6.5 13 L14 3"];
    for (let i = 0; i < 28; i += 1) {
      const pieza = document.createElement("span");
      pieza.className = `pieza ${i % 3 === 0 ? "ambar" : ""}`;
      pieza.style.left = `${Math.random() * 100}%`;
      pieza.style.animationDelay = `${Math.random() * 0.6}s`;
      pieza.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
      pieza.style.setProperty("--giro", `${Math.round(Math.random() * 720 - 360)}deg`);
      pieza.innerHTML = `<svg viewBox="0 0 16 16"><path d="${formas[i % 2]}"/></svg>`;
      capa.appendChild(pieza);
    }
    document.body.appendChild(capa);
    setTimeout(() => capa.remove(), 3200);
  }

  // Las pantallas con [data-mascota] la dibujan al cargar.
  document.querySelectorAll("[data-mascota]").forEach((n) => poner(n, n.dataset.mascota));

  return { svg, poner, festejar };
})();
