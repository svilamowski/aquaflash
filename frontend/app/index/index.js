const API = 'http://localhost:3000/api';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
const tpl = document.getElementById('tpl-cliente');
const lista = document.getElementById('lista-clientes');
const mensaje = document.getElementById('mensaje-estado');

let clientes = [];
let repartidores = [];
let filtro = { tipo: 'todos', dia: null };
let editandoId = null;

const modal = document.getElementById('modal-nuevo');
const modalTitulo = document.getElementById('modal-titulo');
const formNuevo = document.getElementById('form-nuevo');
const formError = document.getElementById('form-error');
const diasVisita = document.getElementById('dias-visita');
const dispenserToggle = document.getElementById('dispenser-toggle');

const formatearFrecuencia = (dias) => {
    if (dias.length === 1) return dias[0];
    if (dias.length === 2) return `${dias[0]} y ${dias[1]}`;
    return `${dias.slice(0, -1).join(', ')} y ${dias.at(-1)}`;
};

const parseFrecuencia = (texto) => {
    if (!texto) return [];
    return DIAS.filter((d) => texto.includes(d));
};

const tieneDispenserEnStock = (stock) =>
    stock?.some((s) => s.productos?.nombre?.toLowerCase().includes('dispenser') && s.cantidad > 0);

const resetFormulario = () => {
    editandoId = null;
    modalTitulo.textContent = 'Nuevo cliente';
    formNuevo.reset();
    formError.hidden = true;
    diasVisita.querySelectorAll('.dia-btn').forEach((b) => b.classList.remove('active'));
    dispenserToggle.querySelectorAll('.toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.dispenser === 'no');
    });
};

const abrirEditar = (cliente) => {
    editandoId = cliente.id;
    modalTitulo.textContent = 'Editar cliente';
    formError.hidden = true;

    formNuevo.nombre.value = cliente.nombre;
    formNuevo.direccion.value = cliente.direccion;
    formNuevo.telefono.value = cliente.telefono;
    formNuevo.repartidor_id.value = cliente.repartidor_id;

    const diasActivos = parseFrecuencia(cliente.frecuencia_visitas);
    diasVisita.querySelectorAll('.dia-btn').forEach((b) => {
        b.classList.toggle('active', diasActivos.includes(b.dataset.dia));
    });

    dispenserToggle.querySelectorAll('.toggle-btn').forEach((b) => {
        const activo = tieneDispenserEnStock(cliente.stock)
            ? b.dataset.dispenser === 'si'
            : b.dataset.dispenser === 'no';
        b.classList.toggle('active', activo);
    });

    modal.hidden = false;
};

diasVisita.addEventListener('click', (e) => {
    const btn = e.target.closest('.dia-btn');
    if (btn) btn.classList.toggle('active');
});

dispenserToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    dispenserToggle.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
});

// --- API ---
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

// --- Helpers ---
const plata = (n) => `$${Number(n).toLocaleString('es-AR')}`;

const haceDias = (fecha) => {
    if (!fecha) return '—';
    const dias = Math.floor((Date.now() - new Date(fecha)) / 86400000);
    return `${Math.max(0, dias)} días`;
};

// --- Tarjeta ---
function pintarStock(contenedor, stock) {
    if (!stock?.length) {
        contenedor.innerHTML = '<p class="tarjeta-cliente__stock-vacio">Sin productos en casa</p>';
        return;
    }
    contenedor.innerHTML = `<ul class="tarjeta-cliente__stock-lista">${stock.map((s) =>
        `<li class="tarjeta-cliente__stock-item"><span>${s.productos?.nombre ?? 'Producto'}</span><span>${s.cantidad} u.</span></li>`
    ).join('')}</ul>`;
}

function crearTarjeta(cliente) {
    const card = tpl.content.cloneNode(true).querySelector('.tarjeta-cliente');
    const deuda = card.querySelector('.tarjeta-cliente__deuda');

    card.dataset.id = cliente.id;

    const nombreLink = card.querySelector('.tarjeta-cliente__nombre');
    nombreLink.textContent = cliente.nombre;
    nombreLink.href = `../cliente/cliente.html?id=${cliente.id}`;

    deuda.textContent = `Deuda: ${plata(cliente.deuda)}`;
    deuda.classList.add(cliente.deuda > 0 ? 'tarjeta-cliente__deuda--alerta' : 'tarjeta-cliente__deuda--ok');

    card.querySelector('.tarjeta-cliente__direccion-texto').textContent = cliente.direccion;
    card.querySelector('.tarjeta-cliente__pago').textContent = `Ult. Pago: ${haceDias(cliente.ultimo_pago)}`;
    card.querySelector('.tarjeta-cliente__compra').textContent = `Ult. Compra: ${haceDias(cliente.ultima_compra)}`;
    pintarStock(card.querySelector('.tarjeta-cliente__stock-contenido'), cliente.stock);

    card.querySelector('.accion-maps').href =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}`;
    card.querySelector('.accion-wapp').href =
        `https://wa.me/54${String(cliente.telefono).replace(/\D/g, '')}`;

    card.querySelectorAll('[data-accion]').forEach((btn) => btn.dataset.id = cliente.id);
    return card;
}

// --- Filtros ---
function clientesVisibles() {
    const texto = document.getElementById('busqueda').value.trim().toLowerCase();
    const deuda = document.getElementById('filtro-deuda').value;
    const repartidor = document.getElementById('filtro-repartidor').value;

    return clientes.filter((c) => {
        if (texto && !c.nombre.toLowerCase().includes(texto) && !c.direccion.toLowerCase().includes(texto)) return false;
        if (filtro.tipo === 'dia' && filtro.dia && !c.frecuencia_visitas?.includes(filtro.dia)) return false;
        if (deuda === 'con-deuda' && c.deuda <= 0) return false;
        if (deuda === 'sin-deuda' && c.deuda > 0) return false;
        if (repartidor && String(c.repartidor_id) !== repartidor) return false;
        return true;
    });
}

function pintar() {
    const visibles = clientesVisibles();
    lista.replaceChildren(...visibles.map(crearTarjeta));
    mensaje.hidden = visibles.length > 0;
    if (!visibles.length) {
        mensaje.textContent = 'No se encontraron clientes con esos filtros.';
        mensaje.classList.remove('mensaje-estado--error');
    }
}

// --- Eventos ---
document.querySelectorAll('.filtro-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
        document.querySelector('.filtro-pill.active')?.classList.remove('active');
        pill.classList.add('active');
        filtro = { tipo: pill.dataset.filtro, dia: pill.dataset.dia ?? null };
        pintar();
    });
});

['busqueda', 'filtro-deuda', 'filtro-repartidor'].forEach((id) => {
    document.getElementById(id).addEventListener(id === 'busqueda' ? 'input' : 'change', pintar);
});

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;

    const cliente = clientes.find((c) => c.id == btn.dataset.id);

    if (btn.dataset.accion === 'baja' && confirm('¿Dar de baja a este cliente?')) {
        try {
            await fetch(`${API}/cliente/${btn.dataset.id}/delete`, { method: 'DELETE' });
            clientes = clientes.filter((c) => c.id != btn.dataset.id);
            pintar();
        } catch {
            alert('Error al eliminar el cliente');
        }
    }

    if (btn.dataset.accion === 'editar' && cliente) {
        abrirEditar(cliente);
    }

    if (btn.dataset.accion === 'no-compra' && cliente) {
        if (!confirm(`¿Registrar que ${cliente.nombre} no quiso comprar en la visita de hoy?`)) return;

        try {
            await post('/visita/create', {
                cliente_id: Number(cliente.id),
                repartidor_id: cliente.repartidor_id,
                compro: false,
                monto_pagado: 0,
                monto_total_venta: 0,
            });
            alert('No compra registrada en el historial');
        } catch (error) {
            alert(error.message || 'Error al registrar no compra');
        }
    }
});

document.getElementById('btn-nuevo').addEventListener('click', () => {
    resetFormulario();
    modal.hidden = false;
});

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; });
});

formNuevo.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const dias = [...diasVisita.querySelectorAll('.dia-btn.active')].map((b) => b.dataset.dia);
    if (!dias.length) {
        formError.textContent = 'Seleccioná al menos un día de visita';
        formError.hidden = false;
        return;
    }

    const tieneDispenser = dispenserToggle.querySelector('[data-dispenser="si"]').classList.contains('active');
    const datos = Object.fromEntries(new FormData(formNuevo));

    datos.repartidor_id = Number(datos.repartidor_id);
    datos.frecuencia_visitas = formatearFrecuencia(dias);
    datos.tiene_dispenser = tieneDispenser;

    if (!editandoId) {
        datos.activo = true;
        datos.es_promocion = false;
        datos.fecha_inicio_promo = null;
    } else {
        const clienteActual = clientes.find((c) => c.id == editandoId);
        datos.es_promocion = clienteActual?.es_promocion ?? false;
    }

    try {
        if (editandoId) {
            const respuesta = await put(`/cliente/${editandoId}/alter`, datos);
            const actualizado = Array.isArray(respuesta) ? respuesta[0] : respuesta;
            const stock = await get(`/cliente/${editandoId}/stock`).catch(() => []);
            const idx = clientes.findIndex((c) => c.id == editandoId);
            if (idx >= 0) clientes[idx] = { ...clientes[idx], ...actualizado, stock };
        } else {
            const nuevo = await post('/cliente/create', datos);
            const stock = await get(`/cliente/${nuevo.id}/stock`).catch(() => []);
            clientes.unshift({ ...nuevo, stock });
        }

        modal.hidden = true;
        resetFormulario();
        pintar();
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    }
});

// --- Inicio ---
async function iniciar() {
    try {
        [repartidores, clientes] = await Promise.all([
            get('/repartidor'),
            get('/cliente').then((datos) => Promise.all(datos.map(async (c) => ({
                ...c,
                stock: await get(`/cliente/${c.id}/stock`).catch(() => []),
            })))),
        ]);

        const selectFiltro = document.getElementById('filtro-repartidor');
        const selectForm = document.getElementById('form-repartidor');
        repartidores.forEach((r) => {
            selectFiltro.add(new Option(r.nombre, r.id));
            selectForm.add(new Option(r.nombre, r.id));
        });

        pintar();
    } catch {
        lista.innerHTML = '';
        mensaje.hidden = false;
        mensaje.classList.add('mensaje-estado--error');
        mensaje.textContent = 'No se pudieron cargar los clientes. Verificá que el backend esté corriendo en http://localhost:3000';
    }
}

iniciar();
