const API = 'http://localhost:3000/api';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];

const params = new URLSearchParams(window.location.search);
const clienteId = params.get('id');

let cliente = null;
let repartidores = [];
let productosCatalogo = [];
let cantidades = {};
let stockEnCasa = {};
let notaActual = '';

const cargando = document.getElementById('cargando');
const errorEl = document.getElementById('error');
const contenido = document.getElementById('contenido');
const modalEditar = document.getElementById('modal-editar');
const formEditar = document.getElementById('form-editar');
const formError = document.getElementById('form-error');

const plata = (n) => `$${Number(n).toLocaleString('es-AR')}`;

const haceDias = (fecha) => {
    if (!fecha) return '—';
    const dias = Math.floor((Date.now() - new Date(fecha)) / 86400000);
    const n = Math.max(0, dias);
    return n === 1 ? 'Hace 1 día' : `Hace ${n} días`;
};

const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const fechaStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fechaStr} ${horaStr}`;
};

const formatearFrecuencia = (dias) => {
    if (dias.length === 1) return dias[0];
    if (dias.length === 2) return `${dias[0]} y ${dias[1]}`;
    return `${dias.slice(0, -1).join(', ')} y ${dias.at(-1)}`;
};

const parseFrecuencia = (texto) => {
    if (!texto) return [];
    return DIAS.filter((d) => texto.includes(d));
};

let stockCliente = [];

const tieneDispenserEnStock = (stock) =>
    stock?.some((s) => s.productos?.nombre?.toLowerCase().includes('dispenser') && s.cantidad > 0);

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

// --- Tabs ---
document.getElementById('tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;

    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach((p) => p.hidden = true);
    document.getElementById(`panel-${tab.dataset.tab}`).hidden = false;
});

// --- Cliente ---
function pintarCliente() {
    document.title = `AquaFlash - ${cliente.nombre}`;
    document.getElementById('cliente-nombre').textContent = cliente.nombre;
    document.getElementById('cliente-direccion').textContent = cliente.direccion;
    document.getElementById('cliente-telefono').textContent = cliente.telefono;
    document.getElementById('cliente-frecuencia').textContent = cliente.frecuencia_visitas || '—';
    document.getElementById('cliente-dispenser').textContent =
        tieneDispenserEnStock(stockCliente) ? 'Sí tiene' : 'No tiene';
    document.getElementById('cliente-pago').textContent = haceDias(cliente.ultimo_pago);
    document.getElementById('cliente-compra').textContent = haceDias(cliente.ultima_compra);

    const deudaCard = document.getElementById('cliente-deuda');
    const tieneDeuda = cliente.deuda > 0;
    deudaCard.classList.toggle('cliente-deuda-card--alerta', tieneDeuda);
    document.getElementById('cliente-deuda-monto').textContent = plata(cliente.deuda);

    document.getElementById('btn-wapp').href =
        `https://wa.me/54${String(cliente.telefono).replace(/\D/g, '')}`;

    document.getElementById('btn-retirar-dispenser').hidden = !tieneDispenserEnStock(stockCliente);
}

function aplicarVentaAlCliente(montoTotal, montoPagado) {
    if (!cliente || (montoTotal <= 0 && montoPagado <= 0)) return;

    const hoy = new Date().toISOString().split('T')[0];
    cliente.deuda = Math.max(0, Number(cliente.deuda || 0) + montoTotal - montoPagado);

    if (montoPagado > 0) cliente.ultimo_pago = hoy;
    if (montoTotal > 0 || montoPagado > 0) cliente.ultima_compra = hoy;

    pintarCliente();
}

function badgeVisita(visita) {
    if (!visita.compro) {
        return '<span class="historial-badge historial-badge--no-compra">No compró</span>';
    }
    if (visita.monto_pagado > 0) {
        const total = visita.monto_total_venta ?? visita.monto_pagado;
        if (total > visita.monto_pagado) {
            return `<span class="historial-badge historial-badge--pago">Pago: ${plata(visita.monto_pagado)} / ${plata(total)}</span>`;
        }
        return `<span class="historial-badge historial-badge--pago">Pago: ${plata(visita.monto_pagado)}</span>`;
    }
    return '<span class="historial-badge historial-badge--sin-pago">Sin pago</span>';
}

function pintarHistorial(visitas) {
    const vacio = document.getElementById('historial-vacio');
    const lista = document.getElementById('historial-lista');

    if (!visitas?.length) {
        vacio.hidden = false;
        lista.innerHTML = '';
        return;
    }

    vacio.hidden = true;
    lista.innerHTML = visitas.map((v) => {
        const lineas = [];
        if (v.entregado && v.entregado !== '-') lineas.push(`Entregado: ${v.entregado}`);
        if (v.retirado && v.retirado !== '-') lineas.push(`Retirado: ${v.retirado}`);
        if (!v.compro && !lineas.length) {
            lineas.push('El cliente no quiso comprar en la visita programada');
        }

        return `
            <li class="historial-item">
                <div>
                    <p class="historial-item__fecha">${formatearFecha(v.fecha)}</p>
                    <div class="historial-item__detalle">
                        ${lineas.map((l) => `<div>${l}</div>`).join('')}
                    </div>
                </div>
                ${badgeVisita(v)}
            </li>
        `;
    }).join('');
}

function cargarStockEnCasa(stock) {
    stockCliente = stock ?? [];
    stockEnCasa = {};
    stock.forEach((s) => {
        const id = s.producto_id
            ?? productosCatalogo.find((p) => p.nombre === s.productos?.nombre)?.id;
        if (id) stockEnCasa[id] = s.cantidad;
    });
}

const getStockProducto = (productoId) => stockEnCasa[productoId] ?? 0;

function actualizarLimitesRetiro(productoId) {
    const fila = document.querySelector(`.producto-fila[data-producto-id="${productoId}"]`);
    if (!fila) return;

    const max = getStockProducto(productoId);
    const retirar = cantidades[productoId]?.retirar ?? 0;
    const btnMas = fila.querySelector('[data-tipo="retirar"] button[data-accion="mas"]');
    const stepper = fila.querySelector('[data-tipo="retirar"]');

    if (btnMas) btnMas.disabled = retirar >= max;
    stepper?.classList.toggle('cantidad-stepper--bloqueado', max === 0);
}

function actualizarTotales() {
    let total = 0;

    productosCatalogo.forEach((p) => {
        const entregar = cantidades[p.id]?.entregar ?? 0;
        const subtotal = entregar * (p.precio ?? 0);
        total += subtotal;

        const subEl = document.querySelector(`[data-subtotal-id="${p.id}"]`);
        if (subEl) {
            subEl.textContent = entregar > 0 ? plata(subtotal) : '—';
            subEl.classList.toggle('producto-fila__subtotal--vacio', entregar === 0);
        }
        actualizarLimitesRetiro(p.id);
    });

    document.getElementById('monto-total').textContent = plata(total);

    const pagado = Number(document.getElementById('monto-pagado').value) || 0;
    const saldoEl = document.getElementById('resumen-saldo');
    const saldoMontoEl = document.getElementById('monto-saldo');
    const deudaActual = Number(cliente?.deuda || 0);
    const deudaResultante = Math.max(0, deudaActual + total - pagado);

    if (total > 0 || pagado > 0) {
        saldoEl.hidden = false;
        saldoMontoEl.textContent = plata(deudaResultante);
    } else {
        saldoEl.hidden = true;
        saldoMontoEl.textContent = plata(0);
    }
}

function pintarStockCards(stock) {
    const contenedor = document.getElementById('stock-cards');
    if (!stock?.length) {
        contenedor.innerHTML = '<p class="panel-vacio">Sin productos en casa</p>';
        return;
    }
    contenedor.innerHTML = stock.map((s) => `
        <div class="stock-card">
            <span class="stock-card__nombre">${s.productos?.nombre ?? 'Producto'}</span>
            <span class="stock-card__cantidad">${s.cantidad}</span>
        </div>
    `).join('');
}

function pintarFormProductos() {
    const contenedor = document.getElementById('productos-form');
    cantidades = {};

    contenedor.innerHTML = productosCatalogo.map((p) => {
        cantidades[p.id] = { entregar: 0, retirar: 0 };
        const enCasa = getStockProducto(p.id);

        return `
            <div class="producto-fila" data-producto-id="${p.id}">
                <div class="producto-fila__info">
                    <span class="producto-fila__nombre">${p.nombre}</span>
                    <span class="producto-fila__precio">${plata(p.precio)} c/u</span>
                </div>
                <span class="producto-fila__subtotal producto-fila__subtotal--vacio" data-subtotal-id="${p.id}">—</span>
                <div class="producto-fila__controles">
                    <div class="cantidad-grupo">
                        <span class="cantidad-grupo__label">Entregar</span>
                        <div class="cantidad-stepper" data-tipo="entregar">
                            <button type="button" data-accion="menos">−</button>
                            <span>0</span>
                            <button type="button" data-accion="mas">+</button>
                        </div>
                    </div>
                    <div class="cantidad-grupo">
                        <span class="cantidad-grupo__label">Retirar vacíos (${enCasa} en casa)</span>
                        <div class="cantidad-stepper ${enCasa === 0 ? 'cantidad-stepper--bloqueado' : ''}" data-tipo="retirar">
                            <button type="button" data-accion="menos">−</button>
                            <span>0</span>
                            <button type="button" data-accion="mas" ${enCasa === 0 ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    actualizarTotales();
}

document.getElementById('productos-form').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-accion]');
    if (!btn || btn.disabled) return;

    const fila = btn.closest('.producto-fila');
    const stepper = btn.closest('.cantidad-stepper');
    const productoId = Number(fila.dataset.productoId);
    const tipo = stepper.dataset.tipo;
    const span = stepper.querySelector('span:not([data-subtotal-id])') ?? stepper.querySelector('span');
    let valor = cantidades[productoId][tipo];

    if (btn.dataset.accion === 'mas') {
        if (tipo === 'retirar' && valor >= getStockProducto(productoId)) return;
        valor += 1;
    } else if (valor > 0) {
        valor -= 1;
    }

    cantidades[productoId][tipo] = valor;
    stepper.querySelectorAll('span').forEach((s) => {
        if (!s.dataset.subtotalId) s.textContent = valor;
    });
    actualizarTotales();
});

document.getElementById('monto-pagado').addEventListener('input', actualizarTotales);
document.getElementById('monto-pagado').addEventListener('change', actualizarTotales);

// --- Notas ---
function pintarNotaVista() {
    const caja = document.getElementById('nota-vista');
    if (notaActual) {
        caja.textContent = notaActual;
        caja.classList.remove('nota-caja--vacia');
    } else {
        caja.textContent = 'Sin notas internas registradas.';
        caja.classList.add('nota-caja--vacia');
    }
}

function mostrarEdicionNota(editar) {
    document.getElementById('nota-vista').hidden = editar;
    document.getElementById('btn-editar-nota').hidden = editar;
    document.getElementById('nota-edicion').hidden = !editar;
    if (editar) {
        document.getElementById('nota-texto').value = notaActual;
    }
}

document.getElementById('btn-editar-nota').addEventListener('click', () => mostrarEdicionNota(true));
document.getElementById('btn-cancelar-nota').addEventListener('click', () => {
    mostrarEdicionNota(false);
    document.getElementById('nota-error').hidden = true;
});

document.getElementById('btn-guardar-nota').addEventListener('click', async () => {
    const notaError = document.getElementById('nota-error');
    notaError.hidden = true;

    try {
        notaActual = document.getElementById('nota-texto').value.trim();
        await put(`/cliente/${clienteId}/nota/alter`, { nota: notaActual });
        pintarNotaVista();
        mostrarEdicionNota(false);
    } catch (error) {
        notaError.textContent = error.message || 'Error al guardar la nota';
        notaError.hidden = false;
    }
});

// --- Movimiento ---
document.getElementById('btn-guardar-movimiento').addEventListener('click', async () => {
    const errorMov = document.getElementById('movimiento-error');
    errorMov.hidden = true;

    const montoPagado = Number(document.getElementById('monto-pagado').value) || 0;
    const productos = productosCatalogo.map((p) => ({
        producto_id: p.id,
        cantidad_entregada: cantidades[p.id]?.entregar ?? 0,
        cantidad_retirada: cantidades[p.id]?.retirar ?? 0,
        precio_total_producto: (cantidades[p.id]?.entregar ?? 0) * (p.precio ?? 0),
    })).filter((p) => p.cantidad_entregada > 0 || p.cantidad_retirada > 0);

    const retiroInvalido = productos.find(
        (p) => p.cantidad_retirada > getStockProducto(p.producto_id)
    );
    if (retiroInvalido) {
        const nombre = productosCatalogo.find((p) => p.id === retiroInvalido.producto_id)?.nombre;
        errorMov.textContent = `No podés retirar más vacíos de ${nombre} de los que tiene en casa (${getStockProducto(retiroInvalido.producto_id)})`;
        errorMov.hidden = false;
        return;
    }

    if (!productos.length && montoPagado <= 0) {
        errorMov.textContent = 'Agregá productos a la venta o ingresá un monto pagado';
        errorMov.hidden = false;
        return;
    }

    const montoTotal = productos.reduce((t, p) => t + p.precio_total_producto, 0);

    try {
        await post('/visita/create', {
            cliente_id: Number(clienteId),
            repartidor_id: cliente.repartidor_id,
            compro: productos.length > 0 || montoPagado > 0,
            monto_pagado: montoPagado,
            monto_total_venta: montoTotal,
            productos,
        });

        document.getElementById('monto-pagado').value = '0';
        aplicarVentaAlCliente(montoTotal, montoPagado);
        await recargarDatos();
        pintarFormProductos();
    } catch (error) {
        errorMov.textContent = error.message || 'Error al guardar el movimiento';
        errorMov.hidden = false;
    }
});

document.getElementById('btn-retirar-dispenser').addEventListener('click', async () => {
    if (!confirm('¿Retirar el dispenser de este cliente?')) return;

    try {
        const respuesta = await put(`/cliente/${clienteId}/alter`, { tiene_dispenser: false });
        cliente = Array.isArray(respuesta) ? respuesta[0] : respuesta;
        pintarCliente();
        await recargarStock();
    } catch (error) {
        alert(error.message || 'Error al retirar el dispenser');
    }
});

// --- Editar cliente ---
const diasVisita = document.getElementById('dias-visita');
const dispenserToggle = document.getElementById('dispenser-toggle');

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

function abrirEditar() {
    formError.hidden = true;
    formEditar.nombre.value = cliente.nombre;
    formEditar.direccion.value = cliente.direccion;
    formEditar.telefono.value = cliente.telefono;
    formEditar.repartidor_id.value = cliente.repartidor_id;

    diasVisita.querySelectorAll('.dia-btn').forEach((b) => {
        b.classList.toggle('active', parseFrecuencia(cliente.frecuencia_visitas).includes(b.dataset.dia));
    });

    dispenserToggle.querySelectorAll('.toggle-btn').forEach((b) => {
        const activo = tieneDispenserEnStock(stockCliente)
            ? b.dataset.dispenser === 'si'
            : b.dataset.dispenser === 'no';
        b.classList.toggle('active', activo);
    });

    modalEditar.hidden = false;
}

document.getElementById('btn-editar').addEventListener('click', abrirEditar);

modalEditar.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modalEditar.hidden = true; });
});

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const dias = [...diasVisita.querySelectorAll('.dia-btn.active')].map((b) => b.dataset.dia);
    if (!dias.length) {
        formError.textContent = 'Seleccioná al menos un día de visita';
        formError.hidden = false;
        return;
    }

    const tieneDispenser = dispenserToggle.querySelector('[data-dispenser="si"]').classList.contains('active');
    const datos = Object.fromEntries(new FormData(formEditar));
    datos.repartidor_id = Number(datos.repartidor_id);
    datos.frecuencia_visitas = formatearFrecuencia(dias);
    datos.tiene_dispenser = tieneDispenser;
    datos.es_promocion = cliente.es_promocion;

    try {
        const respuesta = await put(`/cliente/${clienteId}/alter`, datos);
        cliente = Array.isArray(respuesta) ? respuesta[0] : respuesta;
        pintarCliente();
        modalEditar.hidden = true;
        await recargarStock();
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    }
});

document.getElementById('btn-baja').addEventListener('click', async () => {
    if (!confirm(`¿Dar de baja a ${cliente.nombre}?`)) return;

    try {
        await fetch(`${API}/cliente/${clienteId}/delete`, { method: 'DELETE' });
        window.location.href = '../index/index.html';
    } catch {
        alert('Error al eliminar el cliente');
    }
});

async function recargarStock() {
    const stock = await get(`/cliente/${clienteId}/stock`).catch(() => []);
    cargarStockEnCasa(stock);
    pintarStockCards(stock);
}

async function recargarDatos() {
    const [clienteData, stock, visitas] = await Promise.all([
        get(`/cliente/${clienteId}`),
        get(`/cliente/${clienteId}/stock`).catch(() => []),
        get(`/visita/cliente/${clienteId}`),
    ]);
    cliente = clienteData;
    cargarStockEnCasa(stock);
    pintarCliente();
    pintarStockCards(stock);
    pintarHistorial(visitas);
}

async function iniciar() {
    if (!clienteId) {
        cargando.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'No se indicó qué cliente ver.';
        return;
    }

    try {
        const [clienteData, stock, visitas, nota, reps, productos] = await Promise.all([
            get(`/cliente/${clienteId}`),
            get(`/cliente/${clienteId}/stock`).catch(() => []),
            get(`/visita/cliente/${clienteId}`),
            get(`/cliente/${clienteId}/nota`).catch(() => null),
            get('/repartidor'),
            get('/producto'),
        ]);

        cliente = clienteData;
        repartidores = reps;
        productosCatalogo = productos.filter((p) => !p.nombre.toLowerCase().includes('dispenser'));
        notaActual = nota?.nota ?? '';
        cargarStockEnCasa(stock);

        const selectRep = document.getElementById('form-repartidor');
        selectRep.replaceChildren(...repartidores.map((r) => new Option(r.nombre, r.id)));

        pintarCliente();
        pintarHistorial(visitas);
        pintarStockCards(stock);
        pintarFormProductos();
        pintarNotaVista();

        cargando.hidden = true;
        contenido.hidden = false;
    } catch {
        cargando.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'No se pudo cargar el cliente. Verificá que el backend esté corriendo.';
    }
}

iniciar();
