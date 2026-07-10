
const NAVBAR_HTML = `
<nav>
  <div class="logo">
    <a class="imagen-logo" href="../index/index.html" aria-label="Ir a clientes">
      <img src="../../public/logo.png" alt="Logo AquaFlash">
    </a>
    <a class="texto-logo" href="../index/index.html">AquaFlash</a>
  </div>
  <ul>
    <li>
      <a href="../estadisticas/estadisticas.html" data-nav="estadisticas">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-6"/><path d="M22 20V8"/>
          </svg>
        </span>
        Estadísticas
      </a>
    </li>
    <li>
      <a href="../promocion/promocion.html" data-nav="promocion">
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
      <a href="../stock/stock.html" data-nav="stock">
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
      <a href="../notificaciones/notificaciones.html" data-nav="notificaciones">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>
        Notificaciones
      </a>
    </li>
  </ul>
</nav>
`;

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
}

loadNavbar();
