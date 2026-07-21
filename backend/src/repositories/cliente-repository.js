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
        const { error } = await pool
            .from('productos_clientes')
            .update({ cantidad: actual + cantidad })
            .eq('cliente_id', clienteId)
            .eq('producto_id', productoId);
        if (error) throw new Error('Error al asignar producto al cliente: ' + error.message);
        return;
    }

    const { error } = await pool
        .from('productos_clientes')
        .insert([{ cliente_id: clienteId, producto_id: productoId, cantidad }]);
    if (error) throw new Error('Error al asignar producto al cliente: ' + error.message);
};

export const quitarProductoCliente = async (clienteId, productoId, cantidad = 1) => {
    const actual = await getCantidadProductoCliente(clienteId, productoId);
    if (actual <= 0) return;

    if (actual <= cantidad) {
        const { error } = await pool
            .from('productos_clientes')
            .delete()
            .match({ cliente_id: clienteId, producto_id: productoId });
        if (error) throw new Error('Error al quitar producto del cliente: ' + error.message);
        return;
    }

    const { error } = await pool
        .from('productos_clientes')
        .update({ cantidad: actual - cantidad })
        .eq('cliente_id', clienteId)
        .eq('producto_id', productoId);
    if (error) throw new Error('Error al quitar producto del cliente: ' + error.message);
};

export const getNotaInterna = async (clienteId) => {
    // SELECT nota FROM notas_internas
    // WHERE cliente_id = $1;
    const { data, error } = await pool.from('notas_internas').select('nota').eq('cliente_id', clienteId).single();
    if (error && error.code !== 'PGRST116') throw new Error('Error al obtener nota: ' + error.message);
    return data;
};

export const alterNotaInterna = async (clienteId, clienteNota) => {
    const { data: existing, error: selectError } = await pool
        .from('notas_internas')
        .select('id')
        .eq('cliente_id', clienteId)
        .maybeSingle();

    if (selectError) throw new Error('Error al modificar nota: ' + selectError.message);

    if (existing) {
        const { data, error } = await pool
            .from('notas_internas')
            .update({ nota: clienteNota })
            .eq('cliente_id', clienteId)
            .select();
        if (error) throw new Error('Error al modificar nota: ' + error.message);
        return data;
    }

    const { data, error } = await pool
        .from('notas_internas')
        .insert({ cliente_id: clienteId, nota: clienteNota })
        .select();
    if (error) throw new Error('Error al modificar nota: ' + error.message);
    return data;
};

export const alterCliente = async (entity) => {
    // if (entity.id) {
    //         let sql = `UPDATE clientes SET `;
    //         if (entity.nombre) {
    //             sql += `nombre = '${entity.nombre}' `;
    //         }
    //         if (entity.direccion) {
    //             sql += `direccion = '${entity.direccion}' `;
    //         }
    //         if (entity.telefono) {
    //             sql += `telefono = ${entity.telefono} `;
    //         }
    //         if (entity.deuda) {
    //             sql += `deuda = ${entity.deuda} `;
    //         }
    //         if (entity.activo) {
    //             sql += `activo = ${entity.activo} `;
    //         }
    //         if (entity.ultimo_pago) {
    //             sql += `ultimo_pago = '${entity.ultimo_pago}' `;
    //         }
    //         if (entity.ultima_compra) {
    //             sql += `ultima_compra = '${entity.ultima_compra}' `;
    //         }
    //         if (entity.es_promocion) {
    //             sql += `es_promocion = ${entity.es_promocion} `;
    //         }
    //         if (entity.repartidor_id) {
    //             sql += `repartidor_id = ${entity.repartidor_id} `;
    //         }
    //         if (entity.fecha_inicio_promo) {
    //             sql += `fecha_inicio_promo = ${entity.fecha_inicio_promo} `;
    //         }
    //         if (entity.fecha_creacion) {
    //             sql += `fecha_creacion = ${entity.fecha_creacion} `;
    //         }
    //         if (entity.frecuencia_visitas) {
    //             sql += `frecuencia_visitas = ${entity.frecuencia_visitas} `;
    //         }
    //         sql += `WHERE id = ${entity.id}`;
    const { id, ...datosAActualizar } = entity;
    
    const { data, error } = await pool
        .from('clientes')
        .update(datosAActualizar)
        .eq('id', id)
        .select();
        
    if (error) throw new Error('Error al actualizar cliente: ' + error.message);
    return data;
};

export const createCliente = async (clienteData) => {
    // INSERT INTO clientes (nombre, direccion, telefono, deuda, activo, ultimo_pago, ultima_compra, es_promocion, repartidor_id, fecha_inicio_promo, fecha_creacion, frecuencia_visitas)
    // VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    // RETURNING *;
    
    const { data, error } = await pool
        .from('clientes')
        .insert([clienteData])
        .select()
        .single();
        
    if (error) throw new Error('Error al crear el cliente: ' + error.message);
    return data;
};

export const deleteCliente = async (clienteId) => {
    // DELETE FROM clientes WHERE id = $1
    const { error } = await pool.from('clientes').delete().eq('id', clienteId);
    if (error) throw new Error('Error al eliminar cliente: ' + error.message);
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
