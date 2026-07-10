import pool from '../database/pool.js';

export const getStockFabrica = async () => {
    // SELECT sf.*, p.nombre 
    // FROM stock_fabrica sf
    // INNER JOIN productos p ON sf.producto_id = p.id;
    const { data, error } = await pool.from('stock_fabrica').select('*, productos(nombre)');
    if (error) throw new Error('Error al leer el stock de fábrica: ' + error.message);
    return data;
};

export const updateStockCantidad = async (productoId, nuevaCantidad) => {
    // UPDATE stock_fabrica SET cantidad = $1 WHERE producto_id = $2
    const { data, error } = await pool
        .from('stock_fabrica')
        .update({ cantidad: nuevaCantidad })
        .eq('producto_id', productoId)
        .select();
        
    if (error) throw new Error('Error al actualizar stock: ' + error.message);
    return data;
};

export const createDescartado = async (descarteData) => {
    // INSERT INTO descartados (producto_id, cantidad, fecha) 
    // VALUES ($1, $2, CURRENT_TIMESTAMP) 
    // RETURNING *;
    const { data, error } = await pool.from('descartados').insert([descarteData]).select();
    if (error) throw new Error('Error al registrar descarte: ' + error.message);
    return data;
};