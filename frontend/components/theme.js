const THEME_KEY = 'aquaflash-theme';

function esTemaOscuro() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function aplicarTema(oscuro) {
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
    aplicarTema(!esTemaOscuro());
}

function initTema() {
    if (localStorage.getItem(THEME_KEY) === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

initTema();

window.aquaflashTema = { aplicarTema, alternarTema, esTemaOscuro };
