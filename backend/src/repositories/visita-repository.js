import pool from '../database/pool.js';

export const createVisita = async (visitaData) => {
    const {
        cliente_id,
        repartidor_id,
        compro,
        monto_pagado,
        monto_total_venta,
        fecha,
    } = visitaData;

    const { rows } = await pool.query(
        `INSERT INTO visitas (cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, CURRENT_TIMESTAMP))
         RETURNING *`,
        [cliente_id, repartidor_id, compro, monto_pagado, monto_total_venta, fecha ?? null]
    );
    return rows[0];
};

export const createVentasProductos = async (ventasArray) => {
    const results = [];
    for (const venta of ventasArray) {
        const { rows } = await pool.query(
            `INSERT INTO ventas_productos
                (visita_id, producto_id, cantidad_entregada, cantidad_retirada, precio_total_producto)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                venta.visita_id,
                venta.producto_id,
                venta.cantidad_entregada,
                venta.cantidad_retirada,
                venta.precio_total_producto,
            ]
        );
        results.push(rows[0]);
    }
    return results;
};

export const getVisitasByCliente = async (clienteId) => {
    const { rows } = await pool.query(
        `SELECT v.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'cantidad_entregada', vp.cantidad_entregada,
                            'cantidad_retirada', vp.cantidad_retirada,
                            'precio_total_producto', vp.precio_total_producto,
                            'productos', json_build_object('nombre', p.nombre)
                        )
                    ) FILTER (WHERE vp.id IS NOT NULL),
                    '[]'
                ) AS ventas_productos
         FROM visitas v
         LEFT JOIN ventas_productos vp ON vp.visita_id = v.id
         LEFT JOIN productos p ON p.id = vp.producto_id
         WHERE v.cliente_id = $1
         GROUP BY v.id
         ORDER BY v.fecha DESC`,
        [clienteId]
    );
    return rows;
};

export const getVisitasDeHoyByRepartidor = async (repartidorId) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    const { rows } = await pool.query(
        `SELECT v.*, json_build_object('nombre', c.nombre) AS clientes
         FROM visitas v
         INNER JOIN clientes c ON c.id = v.cliente_id
         WHERE v.repartidor_id = $1
           AND v.fecha >= $2::timestamptz
           AND v.fecha <= ($2::date + INTERVAL '1 day' - INTERVAL '1 second')`,
        [repartidorId, `${hoy}T00:00:00`]
    );
    return rows;
};

export default class VisitaRepository {
    createVisita = createVisita;
    createVentasProductos = createVentasProductos;
    getVisitasByCliente = getVisitasByCliente;
    getVisitasDeHoyByRepartidor = getVisitasDeHoyByRepartidor;
}