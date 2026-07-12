
const NAVBAR_HTML = `
<nav>
  <div class="nav-inner">
  <div class="logo">
    <a class="imagen-logo" href="index.html" aria-label="Ir a clientes">
      <img src="../images/logo.png" alt="Logo AquaFlash">
    </a>
    <a class="texto-logo" href="index.html">AquaFlash</a>
  </div>
  <div class="nav-utils">
    <button type="button" class="nav-btn-tema" id="nav-btn-tema" aria-label="Cambiar tema">
      <span class="nav-btn-tema__sol" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      </span>
      <span class="nav-btn-tema__luna" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>
    </button>
    <ul>
    <li>
      <a href="estadisticas.html" data-nav="estadisticas">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-6"/><path d="M22 20V8"/>
          </svg>
        </span>
        Estadísticas
      </a>
    </li>
    <li>
      <a href="promocion.html" data-nav="promocion">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="8" width="18" height="13" rx="1"/>
            <path d="M12 8v13"/><path d="M3 8h18"/><path d="M9 8c-2 0-3-1.2-3-2.5S7.5 3 9 3c2 0 3 2.5 3 5"/>
            <path d="M15 8c2 0 3-1.2 3-2.5S16.5 3 15 3c-2 0-3 2.5-3 5"/>
          </svg>
        </span>
        Promoción
      </a>
    </li>
    <li>
      <a href="stock.html" data-nav="stock">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/>
            <path d="M12 12v9"/><path d="M20 7.5L12 12 4 7.5"/>
          </svg>
        </span>
        Control de stock
      </a>
    </li>
    <li>
      <a href="notificaciones.html" data-nav="notificaciones" class="nav-notificaciones">
        <span class="nav-icon-wrap">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span class="nav-badge" id="nav-notif-badge" hidden></span>
        </span>
        Notificaciones
      </a>
    </li>
  </ul>
  </div>
  </div>
</nav>
`;

const NOTIF_CACHE_KEY = 'aquaflash-notif-no-leidas';
const NOTIF_API = location.port === "8080"
    ? "http://localhost:3000/api/notificacion/no-leidas"
    : "https://aquaflash-nine.vercel.app/api/notificacion/no-leidas";

function mostrarBadge(cantidad) {
    const badge = document.getElementById('nav-notif-badge');
    if (!badge) return;

    if (cantidad > 0) {
        badge.textContent = cantidad > 99 ? '99+' : cantidad;
        badge.hidden = false;
    } else {
        badge.hidden = true;
    }
}

function leerCacheNotificaciones() {
    const guardado = sessionStorage.getItem(NOTIF_CACHE_KEY);
    if (guardado === null) return null;
    const cantidad = Number(guardado);
    return Number.isFinite(cantidad) ? cantidad : null;
}

function actualizarBadgeNavbar(cantidad) {
    sessionStorage.setItem(NOTIF_CACHE_KEY, String(cantidad));
    mostrarBadge(cantidad);
}

async function cargarBadgeNotificaciones() {
    try {
        const res = await fetch(NOTIF_API);
        if (!res.ok) return;
        const data = await res.json();
        const cantidad = Array.isArray(data) ? data.length : 0;
        actualizarBadgeNavbar(cantidad);
    } catch {
        // Si falla el backend, mantener el valor en caché
    }
}

function restaurarBadgeDesdeCache() {
    const cantidad = leerCacheNotificaciones();
    if (cantidad !== null) {
        mostrarBadge(cantidad);
    }
}

function iniciarActualizacionBadge() {
    restaurarBadgeDesdeCache();
    cargarBadgeNotificaciones();
}

function loadNavbar() {
    const container = document.getElementById('navbar');
    if (!container) return;

    container.innerHTML = NAVBAR_HTML;

    const paginaActual = window.location.pathname.split('/').at(-2);
    if (paginaActual !== 'index' && paginaActual !== 'cliente') {
        container.querySelectorAll(`[data-nav="${paginaActual}"]`).forEach((link) => {
            link.classList.add('active');
        });
    }

    iniciarActualizacionBadge();

    document.getElementById('nav-btn-tema')?.addEventListener('click', () => {
        window.aquaflashTema?.alternarTema();
    });
}

window.actualizarBadgeNavbar = actualizarBadgeNavbar;

window.addEventListener('pageshow', iniciarActualizacionBadge);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        cargarBadgeNotificaciones();
    }
});
window.addEventListener('focus', cargarBadgeNotificaciones);

loadNavbar();
