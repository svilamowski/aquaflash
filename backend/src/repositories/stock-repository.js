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

export const createStockFabrica = async (productoId, cantidad) => {
    const { data, error } = await pool
        .from('stock_fabrica')
        .insert([{ producto_id: productoId, cantidad }])
        .select()
        .single();

    if (error) throw new Error('Error al crear stock de fábrica: ' + error.message);
    return data;
};

export const ajustarStockPorVenta = async (productoId, cantidadEntregada, cantidadRetirada) => {
    const entregada = cantidadEntregada ?? 0;
    const retirada = cantidadRetirada ?? 0;

    const { data: stock, error: selectError } = await pool
        .from('stock_fabrica')
        .select('cantidad')
        .eq('producto_id', productoId)
        .single();

    if (selectError) throw new Error('Error al obtener stock: ' + selectError.message);

    const nuevaCantidad = stock.cantidad - entregada + retirada;
    if (nuevaCantidad < 0) {
        throw new Error('No hay stock suficiente en fábrica para realizar la entrega');
    }

    return updateStockCantidad(productoId, nuevaCantidad);
};

export const descartarStock = async (productoId, cantidadADescartar) => {
    const { data: stock, error: selectError } = await pool
        .from('stock_fabrica')
        .select('cantidad')
        .eq('producto_id', productoId)
        .single();

    if (selectError) throw new Error('Error al obtener stock: ' + selectError.message);

    const nuevaCantidad = stock.cantidad - cantidadADescartar;
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
}