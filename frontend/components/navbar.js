
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
    <ul>
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
    // Muestra u oculta el número de no leídas en el icono del navbar.
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
    // Lee de sessionStorage cuántas no leídas había.
    const guardado = sessionStorage.getItem(NOTIF_CACHE_KEY);
    if (guardado === null) return null;
    const cantidad = Number(guardado);
    return Number.isFinite(cantidad) ? cantidad : null;
}

function actualizarBadgeNavbar(cantidad) {
    // Guarda la cantidad en caché y actualiza el badge.
    sessionStorage.setItem(NOTIF_CACHE_KEY, String(cantidad));
    mostrarBadge(cantidad);
}

async function cargarBadgeNotificaciones() {
    // Consulta al API las no leídas y actualiza el badge.
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
    // Restaura el badge con el valor cacheado (antes de que llegue el API).
    const cantidad = leerCacheNotificaciones();
    if (cantidad !== null) {
        mostrarBadge(cantidad);
    }
}

function iniciarActualizacionBadge() {
    // Muestra caché y luego pide el valor real al API.
    restaurarBadgeDesdeCache();
    cargarBadgeNotificaciones();
}

function loadNavbar() {
    // Inserta el HTML del navbar y activa el badge de notificaciones.
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
