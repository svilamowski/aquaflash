const API = 'http://localhost:3000/api';

const tpl = document.getElementById('tpl-notificacion');
const lista = document.getElementById('lista-notificaciones');
const mensaje = document.getElementById('mensaje-estado');
const badgeTotal = document.getElementById('badge-total');
const badgeNoLeidas = document.getElementById('badge-no-leidas');

let notificaciones = [];

const ICONOS = {
    inactividad: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
        <circle cx="12" cy="8" r="4"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/>
        <path d="M15 9l2 2"/><path d="M17 7l2 2"/>
    </svg>`,
    deuda: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
    </svg>`,
    promocion: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
        <rect x="3" y="8" width="18" height="13" rx="1"/>
        <path d="M12 8v13"/><path d="M3 8h18"/>
        <path d="M9 8c-2 0-3-1.2-3-2.5S7.5 3 9 3c2 0 3 2.5 3 5"/>
        <path d="M15 8c2 0 3-1.2 3-2.5S16.5 3 15 3c-2 0-3 2.5-3 5"/>
    </svg>`,
    alerta: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
    </svg>`,
};

const clasificar = (mensaje) => {
    const m = mensaje.toLowerCase();
    if (m.includes('promoc') || m.includes('retirar')) return 'promocion';
    if (m.includes('debe más') || m.includes('deuda')) return 'deuda';
    if (m.includes('no compra')) return 'inactividad';
    if (m.includes('stock en fábrica') || m.includes('mínimo')) return 'alerta';
    return 'alerta';
};

const formatearFecha = (fecha) => {
    const d = new Date(fecha);
    const fechaStr = d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const horaStr = d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${fechaStr} ${horaStr}`;
};

const contarNoLeidas = () => notificaciones.filter((n) => !n.leido).length;

async function get(ruta) {
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function put(ruta) {
    const res = await fetch(`${API}${ruta}`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    return data;
}

function actualizarBadges() {
    badgeTotal.textContent = notificaciones.length;
    badgeNoLeidas.textContent = contarNoLeidas();
    window.actualizarBadgeNavbar?.(contarNoLeidas());
}

function crearTarjeta(notif) {
    const tipo = clasificar(notif.mensaje);
    const esPromo = tipo === 'promocion';
    const leida = Boolean(notif.leido);
    const card = tpl.content.cloneNode(true).querySelector('.notif-card');

    card.classList.add(leida ? 'notif-card--leida' : (esPromo ? 'notif-card--promocion' : 'notif-card--alerta'));
    card.dataset.id = notif.id;

    const icono = card.querySelector('.notif-card__icono');
    icono.innerHTML = ICONOS[tipo] ?? ICONOS.alerta;

    card.querySelector('.notif-card__mensaje').textContent = notif.mensaje;
    card.querySelector('.notif-card__fecha').textContent = formatearFecha(notif.fecha);

    const btnLeer = card.querySelector('[data-accion="leer"]');
    if (leida) {
        btnLeer.hidden = true;
    } else {
        btnLeer.dataset.id = notif.id;
    }

    return card;
}

function pintar() {
    lista.replaceChildren(...notificaciones.map(crearTarjeta));
    mensaje.hidden = notificaciones.length > 0;
    actualizarBadges();
}

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="leer"]');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!id) return;

    try {
        await put(`/notificacion/${id}/marcar-leida`);
        const notif = notificaciones.find((n) => n.id == id);
        if (notif) notif.leido = true;
        pintar();
    } catch (error) {
        alert(error.message || 'Error al marcar como leída');
    }
});

async function iniciar() {
    try {
        notificaciones = await get('/notificacion');
        if (!Array.isArray(notificaciones)) notificaciones = [];
        pintar();
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        lista.innerHTML = '';
        mensaje.hidden = false;
        mensaje.textContent = 'No se pudieron cargar las notificaciones. Verificá que el backend esté corriendo.';
    }
}

iniciar();
