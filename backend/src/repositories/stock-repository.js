import pool from '../database/pool.js';

export const getStockEnCasas = async () => {
    const { rows } = await pool.query(
        'SELECT producto_id, cantidad FROM productos_clientes'
    );

    const totales = {};
    rows.forEach((row) => {
        totales[row.producto_id] = (totales[row.producto_id] ?? 0) + row.cantidad;
    });
    return totales;
};

export const getStockFabrica = async () => {
    const { rows } = await pool.query(
        `SELECT sf.*, json_build_object('nombre', p.nombre) AS productos
         FROM stock_fabrica sf
         INNER JOIN productos p ON sf.producto_id = p.id`
    );
    return rows;
};

export const updateStockCantidad = async (productoId, nuevaCantidad) => {
    const { rows } = await pool.query(
        `UPDATE stock_fabrica SET cantidad = $1
         WHERE producto_id = $2
         RETURNING *`,
        [nuevaCantidad, productoId]
    );
    return rows;
};

export const createStockFabrica = async (productoId, cantidad) => {
    const { rows } = await pool.query(
        `INSERT INTO stock_fabrica (producto_id, cantidad)
         VALUES ($1, $2)
         RETURNING *`,
        [productoId, cantidad]
    );
    return rows[0];
};

export const ajustarStockPorVenta = async (productoId, cantidadEntregada, cantidadRetirada) => {
    const entregada = cantidadEntregada ?? 0;
    const retirada = cantidadRetirada ?? 0;

    const { rows } = await pool.query(
        'SELECT cantidad FROM stock_fabrica WHERE producto_id = $1',
        [productoId]
    );
    if (!rows[0]) throw new Error('Error al obtener stock: Stock no encontrado');

    const nuevaCantidad = rows[0].cantidad - entregada + retirada;
    if (nuevaCantidad < 0) {
        throw new Error('No hay stock suficiente en fábrica para realizar la entrega');
    }

    return updateStockCantidad(productoId, nuevaCantidad);
};

export const descartarStock = async (productoId, cantidadADescartar) => {
    const { rows } = await pool.query(
        'SELECT cantidad FROM stock_fabrica WHERE producto_id = $1',
        [productoId]
    );
    if (!rows[0]) throw new Error('Error al obtener stock: ' + selectError.message);

    const nuevaCantidad = rows[0].cantidad - cantidadADescartar;
    if (nuevaCantidad < 0) {
        throw new Error('No hay stock suficiente para descartar esa cantidad');
    }

    return updateStockCantidad(productoId, nuevaCantidad);
};

export default class StockRepository {
    getStockFabrica = getStockFabrica;
    updateStockCantidad = updateStockCantidad;
    createStockFabrica = createStockFabrica;
    ajustarStockPorVenta = ajustarStockPorVenta;
    descartarStock = descartarStock;
    getStockEnCasas = getStockEnCasas;
}