import pool from '../database/pool.js';

export const createVisita = async (visitaData) => {
    // INSERT INTO visitas (cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha) 
    // VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
    // RETURNING *;
    const { data, error } = await pool.from('visitas').insert([visitaData]).select().single();
    if (error) throw new Error('Error al registrar visita: ' + error.message);
    return data;
};

export const createVentasProductos = async (ventasArray) => {
    // INSERT INTO ventas_productos (visita_id, producto_id, cantidad_entregada, cantidad_retirada, precio_total_producto) 
    // VALUES 
    //     ($1, $2, $3, $4, $5),
    //      ...
    // RETURNING *;
    const { data, error } = await pool.from('ventas_productos').insert(ventasArray).select();
    if (error) throw new Error('Error al guardar detalles de productos: ' + error.message);
    return data;
};

export const getVisitasByCliente = async (clienteId) => {
    const { data, error } = await pool
        .from('visitas')
        .select('*, ventas_productos(cantidad_entregada, cantidad_retirada, precio_total_producto, productos(nombre))')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false });

    if (error) throw new Error('Error al obtener historial de visitas: ' + error.message);
    return data;
};

export const getVisitasDeHoyByRepartidor = async (repartidorId) => {
    // SELECT * FROM visitas WHERE repartidor_id = $1 AND fecha = HOY
    const hoy = new Date().toISOString().split('T')[0];
    
    const { data, error } = await pool
        .from('visitas')
        .select('*, clientes(nombre)')
        .eq('repartidor_id', repartidorId)
        .gte('fecha', `${hoy}T00:00:00`)
        .lte('fecha', `${hoy}T23:59:59`);
        
    if (error) throw new Error('Error al obtener visitas de hoy: ' + error.message);
    return data;
};

export default class VisitaRepository {
    createVisita = createVisita;
    createVentasProductos = createVentasProductos;
    getVisitasByCliente = getVisitasByCliente;
    getVisitasDeHoyByRepartidor = getVisitasDeHoyByRepartidor;
}