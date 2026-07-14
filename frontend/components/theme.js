const THEME_KEY = 'aquaflash-theme';

function esTemaOscuro() {
    // Devuelve true si el tema actual es oscuro.
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function aplicarTema(oscuro) {
    // Aplica claro/oscuro, lo guarda en localStorage y avisa a la página.
    if (oscuro) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(THEME_KEY, 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(THEME_KEY, 'light');
    }
    window.dispatchEvent(new CustomEvent('aquaflash-theme-change', { detail: { dark: oscuro } }));
}

function alternarTema() {
    // Cambia entre tema claro y oscuro.
    aplicarTema(!esTemaOscuro());
}

function initTema() {
    // Al cargar, aplica el tema guardado en localStorage.
    if (localStorage.getItem(THEME_KEY) === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

initTema();

window.aquaflashTema = { aplicarTema, alternarTema, esTemaOscuro };
