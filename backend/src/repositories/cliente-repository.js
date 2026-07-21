import pool from '../database/pool.js';

export const getAllClientes = async () => {
    const { rows } = await pool.query('SELECT * FROM clientes');
    return rows;
};

export const getStockEnCasa = async (clienteId) => {
    const { rows } = await pool.query(
        `SELECT pc.cantidad, pc.producto_id,
                json_build_object('nombre', p.nombre, 'precio', p.precio) AS productos
         FROM productos_clientes pc
         INNER JOIN productos p ON p.id = pc.producto_id
         WHERE pc.cliente_id = $1`,
        [clienteId]
    );
    return rows;
};

export const getClienteById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (!rows[0]) throw new Error('Error al obtener el cliente: Cliente no encontrado');
    return rows[0];
};

export const getClientesByNombre = async (clienteNombre) => {
    const { rows } = await pool.query(
        'SELECT * FROM clientes WHERE nombre ILIKE $1',
        [`%${clienteNombre}%`]
    );
    return rows;
};

export const getClientesByDireccion = async (clienteDireccion) => {
    const { rows } = await pool.query(
        'SELECT * FROM clientes WHERE direccion ILIKE $1',
        [`%${clienteDireccion}%`]
    );
    return rows;
};

export const getClientesByFrecuencia = async (frecuencia) => {
    const { rows } = await pool.query(
        'SELECT * FROM clientes WHERE frecuencia_visitas = $1',
        [frecuencia]
    );
    return rows;
};

export const getClientesByRepartidor = async (repartidorId) => {
    const { rows } = await pool.query(
        'SELECT * FROM clientes WHERE repartidor_id = $1',
        [repartidorId]
    );
    return rows;
};

export const getClientesByDeuda = async () => {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE deuda > 0');
    return rows;
};

export const getClientesByUltimaCompra = async () => {
    const { rows } = await pool.query(
        `SELECT * FROM clientes
         WHERE ultima_compra <= CURRENT_DATE - INTERVAL '90 days'`
    );
    return rows;
};

export const getClientesEnPromocion = async () => {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE es_promocion = true');
    return rows;
};

export const getCantidadProductoCliente = async (clienteId, productoId) => {
    const { rows } = await pool.query(
        `SELECT cantidad FROM productos_clientes
         WHERE cliente_id = $1 AND producto_id = $2`,
        [clienteId, productoId]
    );
    return rows[0]?.cantidad ?? 0;
};

export const asignarProductoCliente = async (clienteId, productoId, cantidad) => {
    const actual = await getCantidadProductoCliente(clienteId, productoId);

    if (actual > 0) {
        await pool.query(
            `UPDATE productos_clientes SET cantidad = $1
             WHERE cliente_id = $2 AND producto_id = $3`,
            [actual + cantidad, clienteId, productoId]
        );
        return;
    }

    await pool.query(
        `INSERT INTO productos_clientes (cliente_id, producto_id, cantidad)
         VALUES ($1, $2, $3)`,
        [clienteId, productoId, cantidad]
    );
};

export const quitarProductoCliente = async (clienteId, productoId, cantidad = 1) => {
    const actual = await getCantidadProductoCliente(clienteId, productoId);
    if (actual <= 0) return;

    if (actual <= cantidad) {
        await pool.query(
            `DELETE FROM productos_clientes
             WHERE cliente_id = $1 AND producto_id = $2`,
            [clienteId, productoId]
        );
        return;
    }

    await pool.query(
        `UPDATE productos_clientes SET cantidad = $1
         WHERE cliente_id = $2 AND producto_id = $3`,
        [actual - cantidad, clienteId, productoId]
    );
};

export const getNotaInterna = async (clienteId) => {
    const { rows } = await pool.query(
        'SELECT nota FROM notas_internas WHERE cliente_id = $1',
        [clienteId]
    );
    return rows[0] ?? null;
};

export const alterNotaInterna = async (clienteId, clienteNota) => {
    const existing = await pool.query(
        'SELECT id FROM notas_internas WHERE cliente_id = $1',
        [clienteId]
    );

    if (existing.rows[0]) {
        const { rows } = await pool.query(
            `UPDATE notas_internas SET nota = $1
             WHERE cliente_id = $2
             RETURNING *`,
            [clienteNota, clienteId]
        );
        return rows;
    }

    const { rows } = await pool.query(
        `INSERT INTO notas_internas (cliente_id, nota)
         VALUES ($1, $2)
         RETURNING *`,
        [clienteId, clienteNota]
    );
    return rows;
};

export const alterCliente = async (entity) => {
    const { id, ...datosAActualizar } = entity;
    const keys = Object.keys(datosAActualizar);
    if (!keys.length) return [];

    const sets = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => datosAActualizar[key]);

    const { rows } = await pool.query(
        `UPDATE clientes SET ${sets.join(', ')}
         WHERE id = $${keys.length + 1}
         RETURNING *`,
        [...values, id]
    );
    return rows;
};

export const createCliente = async (clienteData) => {
    const columns = Object.keys(clienteData);
    const values = Object.values(clienteData);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    const { rows } = await pool.query(
        `INSERT INTO clientes (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        values
    );
    return rows[0];
};

export const deleteCliente = async (clienteId) => {
    await pool.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
    return true;
}

export default class ClienteRepository {
    getAllClientes = getAllClientes;
    getStockEnCasa = getStockEnCasa;
    getCantidadProductoCliente = getCantidadProductoCliente;
    asignarProductoCliente = asignarProductoCliente;
    quitarProductoCliente = quitarProductoCliente;
    getClienteById = getClienteById;
    getClientesByNombre = getClientesByNombre;
    getClientesByDireccion = getClientesByDireccion;
    getClientesByFrecuencia = getClientesByFrecuencia;
    getClientesByRepartidor = getClientesByRepartidor;
    getClientesByDeuda = getClientesByDeuda;
    getClientesByUltimaCompra = getClientesByUltimaCompra;
    getClientesEnPromocion = getClientesEnPromocion;
    getNotaInterna = getNotaInterna;
    alterNotaInterna = alterNotaInterna;
    alterCliente = alterCliente;
    createCliente = createCliente;
    deleteCliente = deleteCliente;
}
