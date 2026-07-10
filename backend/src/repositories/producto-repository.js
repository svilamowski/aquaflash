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
    // DELETE FROM productos WHERE id = $1;
    const { error } = await pool.from('productos').delete().eq('id', id);
    if (error) throw new Error('Error al eliminar producto: ' + error.message);
    return true;
};