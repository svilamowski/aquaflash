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
    // GET a la API y devuelve el JSON de la respuesta.
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function post(ruta, body) {
    // POST a la API para crear un recurso (producto por ejemplo).
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

async function del(ruta) {
    // DELETE a la API para eliminar un recurso.
    const res = await fetch(`${API}${ruta}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Error en ${ruta}`);
    }
}

function crearTarjeta(item) {
    // Arma la tarjeta visual de un producto del stock.
    const card = tpl.content.cloneNode(true).querySelector('.producto-card'); // Se clona el template de la tarjeta.

    // Se agregan los datos del producto a la tarjeta (nombre, total, stock en fábrica, stock en casas y cantidad mínima de fabrica).
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
    // Rellena el select de productos para comprar/descartar.
    selectAjuste.replaceChildren(
        new Option('Seleccionar producto...', ''),
        ...productos.map((p) => new Option(p.nombre, p.id)),
    );
}

function pintar() {
    // Dibuja todas las tarjetas de productos en pantalla.
    lista.replaceChildren(...productos.map(crearTarjeta));
    mensaje.hidden = productos.length > 0;
    if (!productos.length) {
        mensaje.textContent = 'No hay productos cargados en el sistema.';
        mensaje.classList.remove('mensaje-estado--error');
    }
    pintarSelectAjuste();
}

function mostrarAjusteError(texto) {
    // Muestra u oculta el error del panel de ajuste.
    ajusteError.textContent = texto;
    ajusteError.hidden = !texto;
}

function validarAjuste() {
    // Valida producto y cantidad del ajuste; null si falla.
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
    // Vuelve a pedir el resumen de stock y lo pinta.
    productos = await get('/stock/resumen');
    pintar();
}

document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
    formProducto.reset(); // Se limpia el formulario de nuevo producto.
    formError.hidden = true;
    modal.hidden = false;
});

modal.querySelectorAll('[data-cerrar]').forEach((el) => {
    el.addEventListener('click', () => { modal.hidden = true; }); // Cierra el modal cuando se clickea el botón de cerrar.
});

formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const datos = Object.fromEntries(new FormData(formProducto)); // Se obtiene los datos del formulario.
    datos.cantidad_minima_fabrica = Number(datos.cantidad_minima_fabrica); // Se convierte la cantidad mínima de fabrica a número.
    datos.cantidad = Number(datos.cantidad); // Se convierte la cantidad a número.
    datos.precio = Number(datos.precio); // Se convierte el precio a número.

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
    const ajuste = validarAjuste(); // Se valida el ajuste de compra/descarte.
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
        await recargar(); // Vuelve a cargar el stock.
    } catch (error) {
        mostrarAjusteError(error.message);
    }
});

lista.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="borrar"]'); // Se obtiene el botón de borrar.
    if (!btn) return;

    const producto = productos.find((p) => p.id == btn.dataset.id); // Se obtiene el producto correspondiente al botón.
    const nombre = producto?.nombre ?? 'este producto';
    if (!confirm(`¿Eliminar "${nombre}"? Se borrará también su stock.`)) return; // Se confirma la eliminación del producto.

    try {
        await del(`/producto/${btn.dataset.id}/delete`);
        await recargar(); // Vuelve a cargar el stock.
    } catch (error) {
        alert(error.message || 'Error al eliminar el producto');
    }
});

async function iniciar() {
    // Carga el stock al entrar a la página.
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
