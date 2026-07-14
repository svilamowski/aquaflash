const API = location.port === "8080"
    ? "http://localhost:3000/api"
    : "https://aquaflash-nine.vercel.app/api";
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
const tpl = document.getElementById('tpl-cliente');
const lista = document.getElementById('lista-clientes');
const mensaje = document.getElementById('mensaje-estado');

let clientes = [];
let repartidores = [];
let filtrosPersonalizados = [];
let asignaciones = {};
let filtro = { tipo: 'todos', dia: null, personalizadoId: null };
let editandoId = null;
let editandoFiltroId = null;
let seleccionModal = new Set();

const modal = document.getElementById('modal-nuevo');
const modalTitulo = document.getElementById('modal-titulo');
const formNuevo = document.getElementById('form-nuevo');
const formError = document.getElementById('form-error');
const diasVisita = document.getElementById('dias-visita');
const dispenserToggle = document.getElementById('dispenser-toggle');

const modalFiltro = document.getElementById('modal-filtro');
const modalFiltroTitulo = document.getElementById('modal-filtro-titulo');
const formFiltro = document.getElementById('form-filtro');
const filtroNombre = document.getElementById('filtro-nombre');
const filtroBusquedaClientes = document.getElementById('filtro-busqueda-clientes');
const filtroListaClientes = document.getElementById('filtro-lista-clientes');
const filtroError = document.getElementById('filtro-error');
const contenedorFiltrosPersonalizados = document.getElementById('filtros-personalizados');

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

async function del(ruta) {
    const res = await fetch(`${API}${ruta}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Error en ${ruta}`);
    }
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
    nombreLink.href = `cliente.html?id=${cliente.id}`;

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

// --- Filtros personalizados ---
async function cargarAsignacionesFiltros() {
    asignaciones = {};
    await Promise.all(filtrosPersonalizados.map(async (f) => {
        const clientesFiltro = await get(`/filtro/${f.id}/clientes`).catch(() => []);
        asignaciones[f.id] = new Set((clientesFiltro ?? []).map((c) => c.id));
    }));
}

function pintarFiltrosPersonalizados() {
    contenedorFiltrosPersonalizados.replaceChildren(
        ...filtrosPersonalizados.map((f) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filtro-pill filtro-pill--custom';
            btn.dataset.filtro = 'personalizado';
            btn.dataset.filtroId = f.id;
            if (filtro.tipo === 'personalizado' && filtro.personalizadoId === f.id) {
                btn.classList.add('active');
            }

            btn.innerHTML = `
                <span class="filtro-pill__nombre">${f.nombre}</span>
                <span class="filtro-pill__editar" data-accion="editar-filtro" title="Editar filtro" aria-hidden="true">✎</span>
                <span class="filtro-pill__borrar" data-accion="borrar-filtro" title="Eliminar filtro" aria-label="Eliminar filtro">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>
                    </svg>
                </span>
            `;
            return btn;
        })
    );
}

function pintarListaClientesFiltro() {
    const texto = filtroBusquedaClientes.value.trim().toLowerCase();

    const visibles = [...clientes]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .filter((c) => {
            if (!texto) return true;
            return c.nombre.toLowerCase().includes(texto) || c.direccion.toLowerCase().includes(texto);
        });

    if (!visibles.length) {
        filtroListaClientes.innerHTML = '<p class="filtro-cliente-item__direccion">No hay clientes para mostrar.</p>';
        return;
    }

    filtroListaClientes.replaceChildren(...visibles.map((c) => {
        const label = document.createElement('label');
        label.className = 'filtro-cliente-item';
        label.innerHTML = `
            <input type="checkbox" value="${c.id}" ${seleccionModal.has(c.id) ? 'checked' : ''}>
            <span class="filtro-cliente-item__info">
                <span class="filtro-cliente-item__nombre">${c.nombre}</span>
                <span class="filtro-cliente-item__direccion">${c.direccion}</span>
            </span>
        `;
        return label;
    }));
}

function abrirModalFiltro(filtroId = null) {
    editandoFiltroId = filtroId;
    filtroError.hidden = true;
    filtroBusquedaClientes.value = '';

    if (filtroId) {
        const filtroActual = filtrosPersonalizados.find((f) => f.id === filtroId);
        modalFiltroTitulo.textContent = 'Editar filtro';
        filtroNombre.value = filtroActual?.nombre ?? '';
        filtroNombre.readOnly = false;
        seleccionModal = new Set(asignaciones[filtroId] ?? []);
    } else {
        modalFiltroTitulo.textContent = 'Nuevo filtro';
        filtroNombre.value = '';
        filtroNombre.readOnly = false;
        editandoFiltroId = 'nuevo';
        seleccionModal = new Set();
    }

    pintarListaClientesFiltro();
    modalFiltro.hidden = false;
}

function cerrarModalFiltro() {
    modalFiltro.hidden = true;
    editandoFiltroId = null;
    seleccionModal = new Set();
    formFiltro.reset();
}

function idsSeleccionadosEnModal() {
    return [...seleccionModal];
}

async function sincronizarAsignaciones(filtroId, seleccionados) {
    const actual = asignaciones[filtroId] ?? new Set();
    const nuevos = new Set(seleccionados);

    const agregar = [...nuevos].filter((id) => !actual.has(id));
    const quitar = [...actual].filter((id) => !nuevos.has(id));

    await Promise.all([
        ...agregar.map((id) => post(`/filtro/${filtroId}/cliente/${id}`)),
        ...quitar.map((id) => del(`/filtro/${filtroId}/cliente/${id}/delete`)),
    ]);

    asignaciones[filtroId] = nuevos;
}

function activarFiltroPill(pill) {
    document.querySelectorAll('.filtro-pill.active').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');

    if (pill.dataset.filtro === 'personalizado') {
        filtro = {
            tipo: 'personalizado',
            dia: null,
            personalizadoId: Number(pill.dataset.filtroId),
        };
    } else {
        filtro = {
            tipo: pill.dataset.filtro,
            dia: pill.dataset.dia ?? null,
            personalizadoId: null,
        };
    }
    pintar();
}

// --- Filtros ---
function clientesVisibles() {
    const texto = document.getElementById('busqueda').value.trim().toLowerCase();
    const deuda = document.getElementById('filtro-deuda').value;
    const repartidor = document.getElementById('filtro-repartidor').value;

    return clientes.filter((c) => {
        if (filtro.tipo === 'personalizado' && filtro.personalizadoId) {
            const ids = asignaciones[filtro.personalizadoId];
            if (!ids?.has(c.id)) return false;
        }
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
document.getElementById('filtros').addEventListener('click', (e) => {
    if (e.target.closest('#btn-nuevo-filtro')) {
        abrirModalFiltro();
        return;
    }

    const borrar = e.target.closest('[data-accion="borrar-filtro"]');
    if (borrar) {
        e.stopPropagation();
        const pill = borrar.closest('.filtro-pill--custom');
        if (!pill) return;
        const id = Number(pill.dataset.filtroId);
        const filtroActual = filtrosPersonalizados.find((f) => f.id === id);
        if (!confirm(`¿Eliminar el filtro "${filtroActual?.nombre ?? ''}"?`)) return;

        del(`/filtro/${id}/delete`)
            .then(() => {
                filtrosPersonalizados = filtrosPersonalizados.filter((f) => f.id !== id);
                delete asignaciones[id];
                if (filtro.tipo === 'personalizado' && filtro.personalizadoId === id) {
                    filtro = { tipo: 'todos', dia: null, personalizadoId: null };
                    document.querySelectorAll('.filtro-pill.active').forEach((p) => p.classList.remove('active'));
                    document.querySelector('.filtro-pill[data-filtro="todos"]')?.classList.add('active');
                }
                pintarFiltrosPersonalizados();
                pintar();
            })
            .catch((error) => alert(error.message || 'Error al eliminar el filtro'));
        return;
    }

    const editar = e.target.closest('[data-accion="editar-filtro"]');
    if (editar) {
        e.stopPropagation();
        const pill = editar.closest('.filtro-pill--custom');
        if (pill) abrirModalFiltro(Number(pill.dataset.filtroId));
        return;
    }

    const pill = e.target.closest('.filtro-pill:not(.filtro-pill--agregar)');
    if (!pill) return;
    activarFiltroPill(pill);
});

modalFiltro.querySelectorAll('[data-cerrar-filtro]').forEach((el) => {
    el.addEventListener('click', cerrarModalFiltro);
});

filtroBusquedaClientes.addEventListener('input', pintarListaClientesFiltro);

filtroListaClientes.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    const id = Number(e.target.value);
    if (e.target.checked) seleccionModal.add(id);
    else seleccionModal.delete(id);
});

formFiltro.addEventListener('submit', async (e) => {
    e.preventDefault();
    filtroError.hidden = true;

    const seleccionados = idsSeleccionadosEnModal();
    const nombre = filtroNombre.value.trim();

    try {
        if (editandoFiltroId === 'nuevo') {
            if (!nombre) {
                filtroError.textContent = 'El nombre del filtro es obligatorio';
                filtroError.hidden = false;
                return;
            }

            const creado = await post('/filtro/create', { nombre });
            const filtroNuevo = Array.isArray(creado) ? creado[0] : creado;
            filtrosPersonalizados.push(filtroNuevo);
            await sincronizarAsignaciones(filtroNuevo.id, seleccionados);
            filtro = { tipo: 'personalizado', dia: null, personalizadoId: filtroNuevo.id };
        } else {
            if (!nombre) {
                filtroError.textContent = 'El nombre del filtro es obligatorio';
                filtroError.hidden = false;
                return;
            }

            const actualizado = await put(`/filtro/${editandoFiltroId}/alter`, { nombre });
            const filtroEditado = Array.isArray(actualizado) ? actualizado[0] : actualizado;
            const idx = filtrosPersonalizados.findIndex((f) => f.id === editandoFiltroId);
            if (idx !== -1) {
                filtrosPersonalizados[idx] = {
                    ...filtrosPersonalizados[idx],
                    nombre: filtroEditado?.nombre ?? nombre,
                };
            }
            await sincronizarAsignaciones(editandoFiltroId, seleccionados);
            filtro = { tipo: 'personalizado', dia: null, personalizadoId: editandoFiltroId };
        }

        pintarFiltrosPersonalizados();
        document.querySelectorAll('.filtro-pill.active').forEach((p) => p.classList.remove('active'));
        const pillActivo = contenedorFiltrosPersonalizados.querySelector(
            `[data-filtro-id="${filtro.personalizadoId}"]`
        );
        pillActivo?.classList.add('active');

        cerrarModalFiltro();
        pintar();
    } catch (error) {
        filtroError.textContent = error.message || 'Error al guardar el filtro';
        filtroError.hidden = false;
    }
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
        [repartidores, clientes, filtrosPersonalizados] = await Promise.all([
            get('/repartidor'),
            get('/cliente').then((datos) => Promise.all(datos.map(async (c) => ({
                ...c,
                stock: await get(`/cliente/${c.id}/stock`).catch(() => []),
            })))),
            get('/filtro').catch(() => []),
        ]);

        if (!Array.isArray(filtrosPersonalizados)) filtrosPersonalizados = [];
        await cargarAsignacionesFiltros();
        pintarFiltrosPersonalizados();

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
