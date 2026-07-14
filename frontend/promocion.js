const API = location.port === "8080"
    ? "http://localhost:3000/api"
    : "https://aquaflash-nine.vercel.app/api";
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
    // Devuelve la fecha de hoy a las 00:00.
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy;
};

const formatearFecha = (fecha) => {
    // Formatea una fecha en DD/MM/AAAA.
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const calcularFechaRetiro = (fechaInicio) => {
    // Suma los días de prueba a la fecha de inicio.
    if (!fechaInicio) return null;
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + DIAS_PRUEBA);
    return fecha;
};

const estaVencida = (fechaInicio) => {
    // Indica si ya pasó la fecha de retiro de la promo.
    const retiro = calcularFechaRetiro(fechaInicio);
    if (!retiro) return false;
    const hoy = fechaHoy();
    return retiro < hoy;
};

const actualizarFechasModal = () => {
    // Escribe en el modal las fechas de dejada y retiro.
    const hoy = fechaHoy();
    const retiro = calcularFechaRetiro(hoy);
    promoFechaInicio.textContent = `Dejado: ${formatearFecha(hoy)}`;
    promoFechaRetiro.textContent = `Retirar: ${formatearFecha(retiro)}`;
};

async function get(ruta) {
    // GET a la API y devuelve el JSON de la respuesta.
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function post(ruta, body) {
    // POST a la API para crear un recurso (promoción por ejemplo).
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
    // PUT a la API para actualizar un recurso.
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
    // Arma la tarjeta de un cliente en promoción.
    const card = tpl.content.cloneNode(true).querySelector('.promo-card'); // Se clona el template de la tarjeta.
    const vencida = estaVencida(promo.fecha_inicio_promo);
    const fechaRetiro = calcularFechaRetiro(promo.fecha_inicio_promo);

    card.dataset.id = promo.id; // Se agrega el id de la promoción a la tarjeta.
    if (vencida) card.classList.add('promo-card--vencida');

    // Se agregan los datos de la promoción a la tarjeta (nombre, dirección y teléfono).
    card.querySelector('.promo-card__nombre').textContent = promo.nombre;
    card.querySelector('.promo-card__direccion-texto').textContent = promo.direccion;
    card.querySelector('.promo-card__telefono-texto').textContent = promo.telefono;

    card.querySelector('.accion-maps').href = 
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(promo.direccion)}`; // Se agrega el enlace a Google Maps a la tarjeta.
    card.querySelector('.accion-wapp').href =
        `https://wa.me/54${String(promo.telefono).replace(/\D/g, '')}`; // Se agrega el enlace a WhatsApp a la tarjeta.

    card.querySelector('.promo-card__dejado').textContent =
        `Dejado: ${formatearFecha(promo.fecha_inicio_promo)}`; // Se agrega la fecha de inicio de la promoción a la tarjeta.

    const retirar = card.querySelector('.promo-card__retirar');
    retirar.textContent = `Retirar: ${formatearFecha(fechaRetiro)}`; // Se agrega la fecha de retiro de la promoción a la tarjeta.
    if (vencida) retirar.classList.add('promo-card__retirar--vencida');

    card.querySelector('.promo-card__alerta').hidden = !vencida; // Se oculta el alerta si la promoción no está vencida.
    card.querySelector('[data-accion="agregar"]').dataset.id = promo.id; // Se agrega el id de la promoción al botón de agregar.

    return card;
}

function promosVisibles() {
    // Filtra promociones según el texto de búsqueda.
    const texto = document.getElementById('busqueda').value.trim().toLowerCase();
    if (!texto) return promociones;
    return promociones.filter((p) => // Se filtran las promociones según el texto de búsqueda.
        p.nombre.toLowerCase().includes(texto) ||
        p.direccion.toLowerCase().includes(texto) ||
        String(p.telefono).includes(texto) // Se filtran las promociones según el nombre, dirección y teléfono.
    );
}

function pintar() {
    // Dibuja la lista de promociones visibles.
    const visibles = promosVisibles();
    lista.replaceChildren(...visibles.map(crearTarjeta)); // Se reemplazan las promociones viejas por las nuevas.
    mensaje.hidden = visibles.length > 0; // Se oculta el mensaje si hay promociones visibles.
    if (!visibles.length) {
        mensaje.textContent = promociones.length
            ? 'No se encontraron promociones con esa búsqueda.' // Se muestra el mensaje de no encontradas si no hay promociones visibles.
            : 'No hay promociones activas en este momento.'; // Se muestra el mensaje de no activas si no hay promociones visibles.
        mensaje.classList.remove('mensaje-estado--error'); // Se remueve la clase de error del mensaje.
    }
}

function resetFormulario() {
    // Limpia el formulario de nueva promoción.
    formPromo.reset();
    formError.hidden = true;
    actualizarFechasModal();
}

document.getElementById('busqueda').addEventListener('input', pintar);
// Vuelve a pintar la lista de promociones cuando cambia el texto de búsqueda.

document.getElementById('btn-nueva-promo').addEventListener('click', () => {
    resetFormulario(); // Se limpia el formulario de nueva promoción.
    modal.hidden = false;
}); // Abre el modal para crear una nueva promoción.

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; });
}); // Cierra el modal cuando se clickea el botón de cerrar.

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
        promociones.unshift(nueva); // Se agrega la nueva promoción a la lista de promociones.
        modal.hidden = true;
        resetFormulario(); // Se limpia el formulario de nueva promoción.
        pintar(); // Vuelve a pintar la lista de promociones.
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    }
});

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="agregar"]'); // Se obtiene el botón de agregar.
    if (!btn) return;

    const promo = promociones.find((p) => p.id == btn.dataset.id); // Se obtiene la promoción correspondiente al botón.
    if (!confirm(`¿Agregar a ${promo.nombre} como cliente regular?`)) return; // Se confirma la acción de agregar como cliente regular.

    try {
        await put(`/cliente/${btn.dataset.id}/alter`, { es_promocion: false });
        promociones = promociones.filter((p) => p.id != btn.dataset.id); // Se elimina la promoción de la lista de promociones.
        pintar(); // Vuelve a pintar la lista de promociones.
    } catch (error) {
        alert(error.message || 'Error al agregar como cliente');
    }
});

async function iniciar() {
    // Carga repartidores y promos y pinta la página.
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
