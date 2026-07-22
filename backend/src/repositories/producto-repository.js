import pool from '../database/pool.js';

export const getAllProductos = async () => {
    const { rows } = await pool.query('SELECT * FROM productos');
    return rows;
};

export const getProductoById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (!rows[0]) throw new Error('Error al buscar el producto: Producto no encontrado');
    return rows[0];
};

export const getProductoByNombre = async (nombre) => {
    const { rows } = await pool.query('SELECT * FROM productos WHERE nombre = $1', [nombre]);
    return rows[0] ?? null;
};

export const createProducto = async (productoData) => {
    const { nombre, cantidad_minima_fabrica, cantidad, precio } = productoData;
    const { rows } = await pool.query(
        `INSERT INTO productos (nombre, cantidad_minima_fabrica, cantidad, precio)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nombre, cantidad_minima_fabrica, cantidad, precio]
    );
    return rows[0];
};

export const deleteProducto = async (id) => {
    await pool.query('DELETE FROM stock_fabrica WHERE producto_id = $1', [id]);
    await pool.query('DELETE FROM productos_clientes WHERE producto_id = $1', [id]);
    await pool.query('DELETE FROM descartados WHERE producto_id = $1', [id]);
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    return true;
};

export default class ProductoRepository {
    getAllProductos = getAllProductos;
    getProductoById = getProductoById;
    getProductoByNombre = getProductoByNombre;
    createProducto = createProducto;
    deleteProducto = deleteProducto;
}