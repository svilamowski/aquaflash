const API = location.port === "8080"
    ? "http://localhost:3000/api"
    : "https://aquaflash-nine.vercel.app/api";

const tpl = document.getElementById('tpl-producto');
const lista = document.getElementById('lista-productos');
const mensaje = document.getElementById('mensaje-estado');
const modal = document.getElementById('modal-producto');
const formProducto = document.getElementById('form-producto');
const formError = document.getElementById('form-error');
const selectAjuste = document.getElementById('ajuste-producto');
const inputCantidad = document.getElementById('ajuste-cantidad');
const ajusteError = document.getElementById('ajuste-error');

let productos = [];

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

function crearTarjeta(item) {
    const card = tpl.content.cloneNode(true).querySelector('.producto-card');

    card.dataset.id = item.id;
    card.querySelector('.producto-card__nombre').textContent = item.nombre;
    card.querySelector('.producto-card__total-numero').textContent = item.total;
    card.querySelector('.producto-card__fabrica').textContent = item.en_fabrica;
    card.querySelector('.producto-card__casas').textContent = item.en_casas;
    card.querySelector('.producto-card__min-valor').textContent = item.cantidad_minima_fabrica;
    card.querySelector('[data-accion="borrar"]').dataset.id = item.id;

    return card;
}

function pintarSelectAjuste() {
    selectAjuste.replaceChildren(
        new Option('Seleccionar producto...', ''),
        ...productos.map((p) => new Option(p.nombre, p.id)),
    );
}

function pintar() {
    lista.replaceChildren(...productos.map(crearTarjeta));
    mensaje.hidden = productos.length > 0;
    if (!productos.length) {
        mensaje.textContent = 'No hay productos cargados en el sistema.';
        mensaje.classList.remove('mensaje-estado--error');
    }
    pintarSelectAjuste();
}

function mostrarAjusteError(texto) {
    ajusteError.textContent = texto;
    ajusteError.hidden = !texto;
}

function validarAjuste() {
    const productoId = Number(selectAjuste.value);
    const cantidad = Number(inputCantidad.value);

    if (!productoId) {
        mostrarAjusteError('Seleccioná un producto');
        return null;
    }
    if (!cantidad || cantidad <= 0) {
        mostrarAjusteError('La cantidad debe ser mayor a 0');
        return null;
    }

    mostrarAjusteError('');
    return { productoId, cantidad };
}

async function recargar() {
    productos = await get('/stock/resumen');
    pintar();
}

document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
    formProducto.reset();
    formError.hidden = true;
    modal.hidden = false;
});

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; });
});

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const datos = Object.fromEntries(new FormData(formProducto));
    datos.cantidad_minima_fabrica = Number(datos.cantidad_minima_fabrica);
    datos.cantidad = Number(datos.cantidad);
    datos.precio = Number(datos.precio);

    try {
        await post('/producto/create', datos);
        modal.hidden = true;
        formProducto.reset();
        await recargar();
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    }
});

document.getElementById('btn-comprar').addEventListener('click', async () => {
    const ajuste = validarAjuste();
    if (!ajuste) return;

    try {
        await put(`/stock/fabrica/${ajuste.productoId}/comprar`, { cantidad: ajuste.cantidad });
        await recargar();
    } catch (error) {
        mostrarAjusteError(error.message);
    }
});

document.getElementById('btn-descartar').addEventListener('click', async () => {
    const ajuste = validarAjuste();
    if (!ajuste) return;

    if (!confirm(`¿Descartar ${ajuste.cantidad} unidades de este producto?`)) return;

    try {
        await put('/stock/fabrica/descarte', {
            producto_id: ajuste.productoId,
            cantidad: ajuste.cantidad,
        });
        await recargar();
    } catch (error) {
        mostrarAjusteError(error.message);
    }
});

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="borrar"]');
    if (!btn) return;

    const producto = productos.find((p) => p.id == btn.dataset.id);
    const nombre = producto?.nombre ?? 'este producto';
    if (!confirm(`¿Eliminar "${nombre}"? Se borrará también su stock.`)) return;

    try {
        await del(`/producto/${btn.dataset.id}/delete`);
        await recargar();
    } catch (error) {
        alert(error.message || 'Error al eliminar el producto');
    }
});

async function iniciar() {
    try {
        await recargar();
    } catch {
        lista.innerHTML = '';
        mensaje.hidden = false;
        mensaje.classList.add('mensaje-estado--error');
        mensaje.textContent = 'No se pudo cargar el stock. Verificá que el backend esté corriendo.';
    }
}

iniciar();
