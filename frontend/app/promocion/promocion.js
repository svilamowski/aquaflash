const API = 'http://localhost:3000/api';
const DIAS_PRUEBA = 7;

const tpl = document.getElementById('tpl-promo');
const lista = document.getElementById('lista-promos');
const mensaje = document.getElementById('mensaje-estado');
const modal = document.getElementById('modal-promo');
const formPromo = document.getElementById('form-promo');
const formError = document.getElementById('form-error');
const promoFechaInicio = document.getElementById('promo-fecha-inicio');
const promoFechaRetiro = document.getElementById('promo-fecha-retiro');

let promociones = [];
let repartidores = [];

const fechaHoy = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
};

const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const calcularFechaRetiro = (fechaInicio) => {
    if (!fechaInicio) return null;
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + DIAS_PRUEBA);
    return fecha;
};

const estaVencida = (fechaInicio) => {
    const retiro = calcularFechaRetiro(fechaInicio);
    if (!retiro) return false;
    const hoy = fechaHoy();
    return retiro < hoy;
};

const actualizarFechasModal = () => {
    const hoy = fechaHoy();
    const retiro = calcularFechaRetiro(hoy);
    promoFechaInicio.textContent = `Dejado: ${formatearFecha(hoy)}`;
    promoFechaRetiro.textContent = `Retirar: ${formatearFecha(retiro)}`;
};

async function get(ruta) {
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function post(ruta, body) {
    const res = await fetch(`${API}${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    return data;
}

async function put(ruta, body) {
    const res = await fetch(`${API}${ruta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    return data;
}

function crearTarjeta(promo) {
    const card = tpl.content.cloneNode(true).querySelector('.promo-card');
    const vencida = estaVencida(promo.fecha_inicio_promo);
    const fechaRetiro = calcularFechaRetiro(promo.fecha_inicio_promo);

    card.dataset.id = promo.id;
    if (vencida) card.classList.add('promo-card--vencida');

    card.querySelector('.promo-card__nombre').textContent = promo.nombre;
    card.querySelector('.promo-card__direccion-texto').textContent = promo.direccion;
    card.querySelector('.promo-card__telefono-texto').textContent = promo.telefono;

    card.querySelector('.accion-maps').href =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(promo.direccion)}`;
    card.querySelector('.accion-wapp').href =
        `https://wa.me/54${String(promo.telefono).replace(/\D/g, '')}`;

    card.querySelector('.promo-card__dejado').textContent =
        `Dejado: ${formatearFecha(promo.fecha_inicio_promo)}`;

    const retirar = card.querySelector('.promo-card__retirar');
    retirar.textContent = `Retirar: ${formatearFecha(fechaRetiro)}`;
    if (vencida) retirar.classList.add('promo-card__retirar--vencida');

    card.querySelector('.promo-card__alerta').hidden = !vencida;
    card.querySelector('[data-accion="agregar"]').dataset.id = promo.id;

    return card;
}

function promosVisibles() {
    const texto = document.getElementById('busqueda').value.trim().toLowerCase();
    if (!texto) return promociones;
    return promociones.filter((p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.direccion.toLowerCase().includes(texto) ||
        String(p.telefono).includes(texto)
    );
}

function pintar() {
    const visibles = promosVisibles();
    lista.replaceChildren(...visibles.map(crearTarjeta));
    mensaje.hidden = visibles.length > 0;
    if (!visibles.length) {
        mensaje.textContent = promociones.length
            ? 'No se encontraron promociones con esa búsqueda.'
            : 'No hay promociones activas en este momento.';
        mensaje.classList.remove('mensaje-estado--error');
    }
}

function resetFormulario() {
    formPromo.reset();
    formError.hidden = true;
    actualizarFechasModal();
}

document.getElementById('busqueda').addEventListener('input', pintar);

document.getElementById('btn-nueva-promo').addEventListener('click', () => {
    resetFormulario();
    modal.hidden = false;
});

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; });
});

formPromo.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const datos = Object.fromEntries(new FormData(formPromo));
    const hoy = fechaHoy();

    datos.repartidor_id = Number(datos.repartidor_id);
    datos.frecuencia_visitas = '';
    datos.activo = true;
    datos.es_promocion = true;
    datos.fecha_inicio_promo = hoy.toISOString();
    datos.tiene_dispenser = false;

    try {
        const nueva = await post('/cliente/create', datos);
        promociones.unshift(nueva);
        modal.hidden = true;
        resetFormulario();
        pintar();
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    }
});

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="agregar"]');
    if (!btn) return;

    const promo = promociones.find((p) => p.id == btn.dataset.id);
    if (!confirm(`¿Agregar a ${promo.nombre} como cliente regular?`)) return;

    try {
        await put(`/cliente/${btn.dataset.id}/alter`, { es_promocion: false });
        promociones = promociones.filter((p) => p.id != btn.dataset.id);
        pintar();
    } catch (error) {
        alert(error.message || 'Error al agregar como cliente');
    }
});

async function iniciar() {
    try {
        [repartidores, promociones] = await Promise.all([
            get('/repartidor'),
            get('/cliente/promocion'),
        ]);

        const selectRep = document.getElementById('form-repartidor');
        selectRep.replaceChildren(
            new Option('Seleccionar...', ''),
            ...repartidores.map((r) => new Option(r.nombre, r.id)),
        );

        actualizarFechasModal();
        pintar();
    } catch {
        lista.innerHTML = '';
        mensaje.hidden = false;
        mensaje.classList.add('mensaje-estado--error');
        mensaje.textContent = 'No se pudieron cargar las promociones. Verificá que el backend esté corriendo.';
    }
}

iniciar();
