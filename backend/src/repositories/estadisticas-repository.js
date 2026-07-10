import pool from '../database/pool.js';

export const getVentasFiltradas = async (fechaInicio, fechaFin, repartidorId = null) => {
    /* SQL DINÁMICO:
       SELECT v.*, vp.producto_id, vp.cantidad_entregada, vp.precio_total_producto, p.nombre
       FROM visitas v
       INNER JOIN ventas_productos vp ON v.id = vp.visita_id
       INNER JOIN productos p ON vp.producto_id = p.id
       WHERE v.fecha >= $1 AND v.fecha <= $2
       [Y OPCIONALMENTE: AND v.repartidor_id = $3]
    */
    
    let query = pool
        .from('visitas')
        // Traemos la visita y anidamos los productos vendidos con sus nombres
        .select('*, ventas_productos(*, productos(nombre))')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);
        
    // Si nos pasaron un repartidor, le agregamos el filtro a la query
    if (repartidorId) {
        query = query.eq('repartidor_id', repartidorId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error('Error al obtener datos de ventas: ' + error.message);
    return data;
};

export const getClientesNuevosFiltrados = async (fechaInicio, fechaFin, repartidorId = null) => {
    /* SELECT * FROM clientes 
       WHERE fecha_creacion >= $1 AND fecha_creacion <= $2
    */
    let query = pool
        .from('clientes')
        .select('*')
        .gte('fecha_creacion', fechaInicio)
        .lte('fecha_creacion', fechaFin);
        
    if (repartidorId) {
        query = query.eq('repartidor_id', repartidorId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error('Error al obtener clientes nuevos: ' + error.message);
    return data;
};

export const getEstadoDeudasYPromos = async (repartidorId = null) => {
    /*
       SELECT deuda, es_promocion FROM clientes
       [WHERE repartidor_id = $1]
       
       (Nota: La deuda y ser promo es un estado actual, no depende de 
       una fecha de inicio/fin, a menos que quieras ver las "promos activadas hoy")
    */
    let query = pool
        .from('clientes')
        .select('deuda, es_promocion, repartidor_id, activo');
        
    if (repartidorId) {
        query = query.eq('repartidor_id', repartidorId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error('Error al obtener estado de clientes: ' + error.message);
    return data;
};

export const getRepartidores = async () => {
    const { data, error } = await pool.from('repartidores').select('id, nombre').order('nombre');
    if (error) throw new Error('Error al obtener repartidores: ' + error.message);
    return data;
};

export default class EstadisticasRepository {
    getVentasFiltradas = getVentasFiltradas;
    getClientesNuevosFiltrados = getClientesNuevosFiltrados;
    getEstadoDeudasYPromos = getEstadoDeudasYPromos;
    getRepartidores = getRepartidores;
}