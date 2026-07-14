import pool from '../database/pool.js';

export const getAllProductos = async () => {
    // SELECT * FROM productos
    const { data, error } = await pool.from('productos').select('*');
    if (error) throw new Error('Error al cargar productos: ' + error.message);
    return data;
};

export const getProductoById = async (id) => {
    // SELECT * FROM productos WHERE id = $1
    const { data, error } = await pool.from('productos').select('*').eq('id', id).single();
    if (error) throw new Error('Error al buscar el producto: ' + error.message);
    return data;
};

export const getProductoByNombre = async (nombre) => {
    const { data, error } = await pool.from('productos').select('*').eq('nombre', nombre).maybeSingle();
    if (error) throw new Error('Error al buscar el producto: ' + error.message);
    return data;
};

export const createProducto = async (productoData) => {
    // INSERT INTO productos (nombre, cantidad_minima_fabrica, cantidad, precio) VALUES (...) RETURNING *;
    const { data, error } = await pool
        .from('productos')
        .insert([productoData])
        .select()
        .single();
        
    if (error) throw new Error('Error al crear producto: ' + error.message);
    return data;
};

export const deleteProducto = async (id) => {
    // Limpia filas relacionadas y luego el producto
    const { error: errFabrica } = await pool.from('stock_fabrica').delete().eq('producto_id', id);
    if (errFabrica) throw new Error('Error al eliminar stock de fábrica: ' + errFabrica.message);

    const { error: errCasas } = await pool.from('productos_clientes').delete().eq('producto_id', id);
    if (errCasas) throw new Error('Error al eliminar stock en casas: ' + errCasas.message);

    const { error: errDescartes } = await pool.from('descartados').delete().eq('producto_id', id);
    if (errDescartes) throw new Error('Error al eliminar descartes: ' + errDescartes.message);

    const { error } = await pool.from('productos').delete().eq('id', id);
    if (error) throw new Error('Error al eliminar producto: ' + error.message);
    return true;
};

export default class ProductoRepository {
    getAllProductos = getAllProductos;
    getProductoById = getProductoById;
    getProductoByNombre = getProductoByNombre;
    createProducto = createProducto;
    deleteProducto = deleteProducto;
}