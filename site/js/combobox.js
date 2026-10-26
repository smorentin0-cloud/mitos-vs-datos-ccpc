/*
 * Campo de búsqueda con lista de sugerencias (patrón combobox de ARIA, autocompletado de lista).
 * La lista aparece al enfocar o escribir y se cierra al elegir. ↑/↓ mueven la opción activa,
 * Enter elige, Esc cierra. El valor elegido queda en input.dataset.valor.
 */
const Combobox = (() => {
  const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /*
   * input: <input role="combobox">; lista: <ul role="listbox">; ayuda: <p aria-live> opcional.
   * opciones(): [{ valor, texto }]; alElegir(valor | ""); textos: { visibles(n), ninguno }.
   */
  function crear({ input, lista, ayuda, opciones, alElegir, textos }) {
    let filtradas = [];
    let activa = -1;

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", lista.id);
    input.setAttribute("autocomplete", "off");
    lista.setAttribute("role", "listbox");
    lista.hidden = true;

    function abrir(abierta) {
      lista.hidden = !abierta;
      input.setAttribute("aria-expanded", String(abierta));
      if (!abierta) {
        activa = -1;
        input.removeAttribute("aria-activedescendant");
      }
    }

    function pintar() {
      const f = sinAcentos(input.value.trim());
      filtradas = opciones().filter((o) => sinAcentos(o.texto).includes(f));
      lista.replaceChildren(...filtradas.map((o, i) => {
        const li = document.createElement("li");
        li.id = `${lista.id}-${i}`;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === activa));
        li.textContent = o.texto;
        // mousedown para elegir antes de que el campo pierda el foco
        li.addEventListener("mousedown", (e) => { e.preventDefault(); elegir(o); });
        return li;
      }));
      if (ayuda) ayuda.textContent = filtradas.length ? textos.visibles(filtradas.length) : textos.ninguno;
    }

    function marcarActiva(i) {
      activa = i;
      [...lista.children].forEach((li, k) => li.setAttribute("aria-selected", String(k === i)));
      if (i >= 0 && lista.children[i]) {
        input.setAttribute("aria-activedescendant", lista.children[i].id);
        lista.children[i].scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function elegir(o) {
      input.value = o ? o.texto : "";
      input.dataset.valor = o ? String(o.valor) : "";
      abrir(false);
      alElegir(input.dataset.valor);
    }

    input.addEventListener("focus", () => { pintar(); abrir(true); });
    input.addEventListener("input", () => {
      if (input.dataset.valor) { input.dataset.valor = ""; alElegir(""); }
      activa = -1;
      pintar();
      abrir(true);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (lista.hidden) { pintar(); abrir(true); }
        const n = filtradas.length;
        if (!n) return;
        marcarActiva(e.key === "ArrowDown" ? (activa + 1) % n : (activa - 1 + n) % n);
      } else if (e.key === "Enter") {
        if (lista.hidden) return;
        e.preventDefault();
        if (activa >= 0) elegir(filtradas[activa]);
        else if (filtradas.length === 1) elegir(filtradas[0]);
      } else if (e.key === "Escape" && !lista.hidden) {
        e.preventDefault();
        e.stopPropagation();
        abrir(false);
      }
    });
    input.addEventListener("blur", () => {
      // Si se escribió el nombre exacto, se toma como elegido.
      if (!input.dataset.valor) {
        const exacta = filtradas.find((o) => sinAcentos(o.texto) === sinAcentos(input.value.trim()));
        if (exacta) elegir(exacta);
      }
      abrir(false);
    });

    return {
      valor: () => input.dataset.valor || "",
      poner: (valor) => elegir(opciones().find((o) => String(o.valor) === String(valor)) || null),
      limpiar: () => { input.value = ""; input.dataset.valor = ""; abrir(false); },
    };
  }

  return { crear, sinAcentos };
})();
