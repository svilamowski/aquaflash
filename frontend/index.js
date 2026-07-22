const API = location.port === "8080"
    ? "http://localhost:3000/api"
    : "https://aquaflash-nine.vercel.app/api";
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
const tpl = document.getElementById('tpl-cliente');
const lista = document.getElementById('lista-clientes');
const mensaje = document.getElementById('mensaje-estado');
const rutaResumen = document.getElementById('ruta-resumen');
// Token para ignorar respuestas viejas si el usuario cambia filtros mientras carga
let pintadoRutaId = 0;

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
    // Convierte un array de días en texto legible (ej: "Lunes y Martes").
    if (dias.length === 1) return dias[0];
    if (dias.length === 2) return `${dias[0]} y ${dias[1]}`;
    return `${dias.slice(0, -1).join(', ')} y ${dias.at(-1)}`;
};

const parseFrecuencia = (texto) => {
    // Extrae del texto de frecuencia los días que están en la lista DIAS.
    if (!texto) return [];
    return DIAS.filter((d) => texto.includes(d));
};

const tieneDispenserEnStock = (stock) =>
    // Indica si el stock del cliente incluye dispenser.
    stock?.some((s) => s.productos?.nombre?.toLowerCase().includes('dispenser') && s.cantidad > 0);

const resetFormulario = () => {
    // Limpia el modal de cliente y lo deja listo para alta nueva.
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
    // Abre el modal precargado con los datos del cliente a editar.
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
    // GET al API: pide datos y los devuelve como JSON.
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function post(ruta, body) {
    // POST al API: crea un recurso (un cliente/ filtro/ producto, etc) y devuelve la respuesta.
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
    // PUT al API: actualiza un recurso y devuelve la respuesta.
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
    // DELETE al API: elimina un recurso.
    const res = await fetch(`${API}${ruta}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Error en ${ruta}`);
    }
}

// --- Helpers ---
const plata = (n) => `$${Number(n).toLocaleString('es-AR')}`;
// Formatea un número como pesos argentinos.

const haceDias = (fecha) => {
    // Calcula cuántos días pasaron desde una fecha hasta hoy.
    if (!fecha) return '—';
    const dias = Math.floor((Date.now() - new Date(fecha)) / 86400000);
    return `${Math.max(0, dias)} días`;
};

// --- Tarjeta ---
function pintarStock(contenedor, stock) {
    // Muestra la lista de productos en casa dentro de una tarjeta.
    if (!stock?.length) {
        contenedor.innerHTML = '<p class="tarjeta-cliente__stock-vacio">Sin productos en casa</p>';
        return;
    }
    contenedor.innerHTML = `<ul class="tarjeta-cliente__stock-lista">${stock.map((s) =>
        `<li class="tarjeta-cliente__stock-item"><span>${s.productos?.nombre ?? 'Producto'}</span><span>${s.cantidad} u.</span></li>`
    ).join('')}</ul>`;
}

function crearTarjeta(cliente) {
    // Clona el template y arma la tarjeta de un cliente.
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
    // Trae del API qué clientes tiene cada filtro personalizado.
    asignaciones = {};
    await Promise.all(filtrosPersonalizados.map(async (f) => {
        const clientesFiltro = await get(`/filtro/${f.id}/clientes`).catch(() => []);
        asignaciones[f.id] = new Set((clientesFiltro ?? []).map((c) => c.id));
    }));
}

function pintarFiltrosPersonalizados() {
    // Dibuja los botones de filtros personalizados.
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
    // Lista los checkboxes de clientes dentro del modal de filtro.
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
    // Abre el modal para crear o editar un filtro personalizado.
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
    // Cierra y resetea el modal de filtro.
    modalFiltro.hidden = true;
    editandoFiltroId = null;
    seleccionModal = new Set();
    formFiltro.reset();
}

function idsSeleccionadosEnModal() {
    // Devuelve los ids de clientes marcados en el modal.
    return [...seleccionModal];
}

async function sincronizarAsignaciones(filtroId, seleccionados) {
    // Agrega/quita clientes del filtro en el API según la selección.
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
    // Activa un pill (el circulito) de filtro y vuelve a pintar la lista.
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
    // Devuelve los clientes que pasan búsqueda y filtros actuales.
    const texto = document.getElementById('busqueda').value.trim().toLowerCase();
    const deuda = document.getElementById('filtro-deuda').value;
    const repartidor = document.getElementById('filtro-repartidor').value;

    return clientes.filter((c) => {
        if (c.es_promocion) return false;
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

// --- Ruta sugerida (día + repartidor) ---
// La lógica de cálculo está en ruta.js (window.RutaSugerida).
// Acá solo decidimos cuándo activarla y cómo dibujarla.

function ocultarRutaResumen() {
    // Saca el banner de tiempo estimado cuando no hay modo ruta
    rutaResumen.hidden = true;
    rutaResumen.innerHTML = '';
}

function pintarListaPlana(visibles) {
    // Listado normal de cards (sin viajes ni banner de ruta)
    ocultarRutaResumen();
    lista.replaceChildren(...visibles.map(crearTarjeta));
    mensaje.hidden = visibles.length > 0;
    if (!visibles.length) {
        mensaje.textContent = 'No se encontraron clientes con esos filtros.';
        mensaje.classList.remove('mensaje-estado--error');
    }
}

function crearBloqueViaje(viaje, numero) {
    // Arma un bloque "Viaje N" con sus cards ordenadas y el aviso de capacidad libre
    const bloque = document.createElement('section');
    bloque.className = 'viaje-bloque';

    const titulo = document.createElement('h2');
    titulo.className = 'viaje-bloque__titulo';
    titulo.textContent = `Viaje ${numero}`;
    bloque.appendChild(titulo);

    // Cuántos envases usa este viaje vs capacidad del camión
    const meta = document.createElement('p');
    meta.className = 'viaje-bloque__meta';
    meta.textContent =
        `Carga estimada: ${viaje.cargaUsada} / ${RutaSugerida.CAPACIDAD_CAMION} envases`;
    bloque.appendChild(meta);

    const listaViaje = document.createElement('div');
    listaViaje.className = 'viaje-bloque__lista';
    viaje.clientes.forEach((item, idx) => {
        const card = crearTarjeta(item.cliente);
        // Numerito de orden dentro del viaje (1, 2, 3…)
        const orden = document.createElement('span');
        orden.className = 'tarjeta-cliente__orden-ruta';
        orden.textContent = `${idx + 1}`;
        card.querySelector('.tarjeta-cliente__header')?.prepend(orden);
        // Carga estimada de ese cliente (para entender por qué entró en este viaje)
        const cargaHint = document.createElement('p');
        cargaHint.className = 'tarjeta-cliente__carga-ruta';
        cargaHint.textContent = `Carga estimada: ${item.carga} envases`;
        card.querySelector('.tarjeta-cliente__info')?.appendChild(cargaHint);
        listaViaje.appendChild(card);
    });
    bloque.appendChild(listaViaje);

    // Si sobra espacio en el camión, avisamos debajo del viaje
    if (viaje.capacidadLibre > 0) {
        const aviso = document.createElement('p');
        aviso.className = 'viaje-bloque__aviso';
        aviso.textContent =
            `Se pueden agregar más clientes a este viaje (quedan ${viaje.capacidadLibre} envases libres).`;
        bloque.appendChild(aviso);
    }

    return bloque;
}

async function pintarRutaSugerida(visibles, token) {
    // 1) Muestra "calculando…"
    // 2) Pide cargas (historial de visitas)
    // 3) Ordena por proximidad desde la fábrica
    // 4) Parte en viajes por capacidad
    // 5) Calcula tiempo y pinta banner + bloques
    rutaResumen.hidden = false;
    rutaResumen.innerHTML = '<p class="ruta-resumen__cargando">Calculando ruta sugerida…</p>';
    lista.innerHTML = '';
    mensaje.hidden = true;

    // Carga estimada por cliente según última compra de ese día
    const items = await RutaSugerida.adjuntarCargas(visibles, filtro.dia, get);
    // Si el usuario cambió filtros mientras esperábamos, descartamos este resultado
    if (token !== pintadoRutaId) return;

    const ordenados = RutaSugerida.ordenarItemsPorProximidad(items);
    const viajes = RutaSugerida.armarViajes(ordenados);
    const minutos = RutaSugerida.estimarMinutosTotales(viajes);

    // Banner arriba de todo con el tiempo total del día
    rutaResumen.innerHTML = `
        <p class="ruta-resumen__titulo">Ruta sugerida</p>
        <p class="ruta-resumen__tiempo">
            Tiempo estimado del reparto: <strong>${RutaSugerida.formatearDuracion(minutos)}</strong>
        </p>
        <p class="ruta-resumen__detalle">
            ${viajes.length} viaje${viajes.length === 1 ? '' : 's'} · ${visibles.length} cliente${visibles.length === 1 ? '' : 's'}
            · Partiendo de ${RutaSugerida.DIRECCION_FABRICA}
        </p>
    `;

    lista.innerHTML = '';
    viajes.forEach((viaje, i) => {
        lista.appendChild(crearBloqueViaje(viaje, i + 1));
    });
}

async function pintar() {
    // Punto de entrada: lista normal O ruta sugerida
    const visibles = clientesVisibles();
    const repartidor = document.getElementById('filtro-repartidor').value;
    // Solo con día de la semana + repartidor elegidos
    const enModoRuta = RutaSugerida.modoRutaActivo(filtro.tipo, filtro.dia, repartidor);

    if (!enModoRuta) {
        // Invalidamos cualquier cálculo de ruta en curso
        pintadoRutaId += 1;
        pintarListaPlana(visibles);
        return;
    }

    if (!visibles.length) {
        pintadoRutaId += 1;
        ocultarRutaResumen();
        lista.innerHTML = '';
        mensaje.hidden = false;
        mensaje.textContent = 'No se encontraron clientes con esos filtros.';
        mensaje.classList.remove('mensaje-estado--error');
        return;
    }

    // Token de esta pintura: si cambia el filtro, el token viejo se ignora
    const token = ++pintadoRutaId;
    try {
        await pintarRutaSugerida(visibles, token);
    } catch (error) {
        if (token !== pintadoRutaId) return;
        console.error(error);
        pintarListaPlana(visibles);
        alert(error.message || 'No se pudo calcular la ruta sugerida');
    }
}

// --- Eventos ---
document.getElementById('filtros').addEventListener('click', (e) => {
    if (e.target.closest('#btn-nuevo-filtro')) {
        // Maneja el click en el botón de nuevo filtro.
        abrirModalFiltro();
        // Abre el modal para crear un nuevo filtro.
        return;
    }

    const borrar = e.target.closest('[data-accion="borrar-filtro"]');
    if (borrar) {
        e.stopPropagation();
        // Maneja el click en el botón de borrar un filtro.
        const pill = borrar.closest('.filtro-pill--custom');
        // Obtiene el pill (el circulito) del filtro.
        if (!pill) return;
        // Si no hay pill, sale.
        const id = Number(pill.dataset.filtroId);
        // Obtiene el id del filtro.
        const filtroActual = filtrosPersonalizados.find((f) => f.id === id);
        // Obtiene el filtro actual.
        if (!confirm(`¿Eliminar el filtro "${filtroActual?.nombre ?? ''}"?`)) return;
        // Si no se confirma la eliminación, sale.

        del(`/filtro/${id}/delete`)
            // Elimina el filtro del API.
            .then(() => {
                filtrosPersonalizados = filtrosPersonalizados.filter((f) => f.id !== id);
                // Actualiza la lista de filtros.
                delete asignaciones[id];
                // Elimina la asignación del filtro.
                if (filtro.tipo === 'personalizado' && filtro.personalizadoId === id) {
                    // Si el filtro actual es el filtro personalizado, se actualiza el filtro.
                    filtro = { tipo: 'todos', dia: null, personalizadoId: null };
                    document.querySelectorAll('.filtro-pill.active').forEach((p) => p.classList.remove('active'));
                    // Elimina el pill activo.
                    document.querySelector('.filtro-pill[data-filtro="todos"]')?.classList.add('active');
                    // Activa el pill de todos.
                }
                pintarFiltrosPersonalizados();
                // Vuelve a pintar los filtros personalizados.
                pintar();
                // Vuelve a pintar la lista de clientes.
            })
            .catch((error) => alert(error.message || 'Error al eliminar el filtro'));
            // Si hay un error, muestra un mensaje de error.
        return;
    }

    const editar = e.target.closest('[data-accion="editar-filtro"]');
    if (editar) {
        e.stopPropagation();
        const pill = editar.closest('.filtro-pill--custom');
        if (pill) abrirModalFiltro(Number(pill.dataset.filtroId));
        // Abre el modal para editar el filtro.
        return;
    }

    const pill = e.target.closest('.filtro-pill:not(.filtro-pill--agregar)');
    if (!pill) return;
    activarFiltroPill(pill);
});

modalFiltro.querySelectorAll('[data-cerrar-filtro]').forEach((el) => {
    // Maneja el click en el botón de cerrar el modal de filtro.
    el.addEventListener('click', cerrarModalFiltro);
});

filtroBusquedaClientes.addEventListener('input', pintarListaClientesFiltro);
// Vuelve a pintar la lista de clientes dentro del modal de filtro.

filtroListaClientes.addEventListener('change', (e) => {
    // Maneja el cambio en la selección de clientes dentro del modal de filtro.
    if (e.target.type !== 'checkbox') return;
    // Si no es un checkbox, sale.
    const id = Number(e.target.value);
    // Obtiene el id del cliente.
    if (e.target.checked) seleccionModal.add(id);
    // Si el checkbox está marcado, agrega el id al conjunto de clientes seleccionados.
    else seleccionModal.delete(id);
    // Si el checkbox no está marcado, elimina el id del conjunto de clientes seleccionados.
});

formFiltro.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Maneja el submit del formulario de filtro.
    filtroError.hidden = true;

    const seleccionados = idsSeleccionadosEnModal();
    // Obtiene los ids de los clientes seleccionados.
    const nombre = filtroNombre.value.trim();
    // Obtiene el nombre del filtro.

    try {
        if (editandoFiltroId === 'nuevo') {
            if (!nombre) {
                // Si no hay nombre, muestra un mensaje de error.
                filtroError.textContent = 'El nombre del filtro es obligatorio';
                filtroError.hidden = false;
                return;
            }

            const creado = await post('/filtro/create', { nombre });
            // Crea el filtro en el API.
            const filtroNuevo = Array.isArray(creado) ? creado[0] : creado;
            filtrosPersonalizados.push(filtroNuevo);
            // Agrega el filtro a la lista de filtros personalizados.
            await sincronizarAsignaciones(filtroNuevo.id, seleccionados);
            // Sincroniza las asignaciones de clientes con el filtro.
            filtro = { tipo: 'personalizado', dia: null, personalizadoId: filtroNuevo.id };
            // Actualiza el filtro actual.

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
        // Obtiene el pill del filtro.
        pillActivo?.classList.add('active');
        // Activa el pill del filtro.

        cerrarModalFiltro();
        pintar();
    } catch (error) {
        filtroError.textContent = error.message || 'Error al guardar el filtro';
        filtroError.hidden = false;
    }
});

['busqueda', 'filtro-deuda', 'filtro-repartidor'].forEach((id) => {
    document.getElementById(id).addEventListener(id === 'busqueda' ? 'input' : 'change', pintar);
}); // Vuelve a pintar la lista de clientes cuando cambia el filtro de búsqueda o de repartidor.

lista.addEventListener('click', async (e) => {
    // Maneja el click en la lista de clientes.
    const btn = e.target.closest('[data-accion]');
    // Obtiene el botón clickeado.
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
        // Abre el modal para editar el cliente.
    }

    if (btn.dataset.accion === 'no-compra' && cliente) {
        if (!confirm(`¿Registrar que ${cliente.nombre} no quiso comprar en la visita de hoy?`)) return;

        try {
            // Registra la no compra en el API.
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
}); // Abre el modal para crear un nuevo cliente.

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; });
}); // Cierra el modal cuando se clickea el botón de cerrar.

formNuevo.addEventListener('submit', async (e) => {
    // Maneja el submit del formulario de nuevo cliente.
    e.preventDefault();
    formError.hidden = true;
    // Oculta el mensaje de error.

    const dias = [...diasVisita.querySelectorAll('.dia-btn.active')].map((b) => b.dataset.dia);
    // Obtiene los días de visita seleccionados.
    if (!dias.length) {
        formError.textContent = 'Seleccioná al menos un día de visita';
        formError.hidden = false;
        return; // Si no hay días de visita seleccionados, muestra un mensaje de error.
    }

    const tieneDispenser = dispenserToggle.querySelector('[data-dispenser="si"]').classList.contains('active');
    // Obtiene si el cliente tiene dispenser.
    const datos = Object.fromEntries(new FormData(formNuevo));
    // Obtiene los datos del formulario.
    datos.repartidor_id = Number(datos.repartidor_id); // Convierte el id del repartidor a número.
    datos.frecuencia_visitas = formatearFrecuencia(dias); // Formatea las frecuencias de visita.
    datos.tiene_dispenser = tieneDispenser; // Obtiene si el cliente tiene dispenser.

    if (!editandoId) { // Si no se está editando un cliente, se activa el cliente y se desactiva la promoción.
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
    // Arranca la página: carga datos del API y pinta la UI.
    try {
        [repartidores, clientes, filtrosPersonalizados] = await Promise.all([
            get('/repartidor'),
            get('/cliente').then((datos) => Promise.all(
                (datos ?? [])
                    .filter((c) => !c.es_promocion)
                    .map(async (c) => ({
                        ...c,
                        stock: await get(`/cliente/${c.id}/stock`).catch(() => []),
                    }))
            )),
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
