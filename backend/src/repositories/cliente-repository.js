import pool from '../database/pool.js';

export const getAllClientes = async () => {
    // SELECT * FROM clientes
    const { data, error } = await pool.from('clientes').select('*');
    if (error) throw new Error('Error al obtener clientes: ' + error.message);
    return data;
};

export const getStockEnCasa = async (clienteId) => {
    // SELECT p.nombre, pc.cantidad FROM productos_clientes pc
    // INNER JOIN productos p on p.id = pc.producto_id
    // WHERE pc.cliente_id = $1
    const { data, error } = await pool
        .from('productos_clientes')
        .select('cantidad, productos(nombre, precio)')
        .eq('cliente_id', clienteId);
        
    if (error) throw new Error('Error al obtener stock del cliente: ' + error.message);
    return data;

};

export const getClienteById = async (id) => {
    // SELECT * FROM clientes WHERE id = $1
    // Usamos .single() porque sabemos que el ID es único y queremos un objeto, no un array
    const { data, error } = await pool.from('clientes').select('*').eq('id', id).single();
    if (error) throw new Error('Error al obtener el cliente: ' + error.message);
    return data;
};

export const getClientesByNombre = async (clienteNombre) => {
    // SELECT * FROM clientes
    // WHERE nombre = $1
    const { data, error } = await pool.from('clientes').select('*').ilike('nombre', `%${clienteNombre}%`);
    if (error) throw new Error('Error al buscar clientes: ' + error.message);
    return data;
};

export const getClientesByDireccion = async (clienteDireccion) => {
    // SELECT * FROM clientes
    // WHERE direccion = $1
    const { data, error } = await pool.from('clientes').select('*').ilike('direccion', `%${clienteDireccion}%`);
    if (error) throw new Error('Error al buscar por dirección: ' + error.message);
    return data;
};

export const getClientesByFrecuencia = async (frecuencia) => {
    // SELECT * FROM clientes WHERE frecuencia_visitas = $1
    const { data, error } = await pool.from('clientes').select('*').eq('frecuencia_visitas', frecuencia);
    if (error) throw new Error('Error al filtrar por frecuencia: ' + error.message);
    return data;
};

export const getClientesByRepartidor = async (repartidorId) => {
    // SELECT * FROM clientes WHERE repartidor_id = $1
    const { data, error } = await pool.from('clientes').select('*').eq('repartidor_id', repartidorId);
    if (error) throw new Error('Error al buscar clientes del repartidor: ' + error.message);
    return data;
};

export const getClientesByDeuda = async () => {
    // SELECT * FROM clientes
    // WHERE deuda > 0
    const { data, error } = await pool.from('clientes').select('*').gt('deuda', 0);
    if (error) throw new Error('Error al buscar deudores: ' + error.message);
    return data;
};

export const getClientesByUltimaCompra = async () => {
    // SELECT *
    // FROM clientes
    // WHERE ultima_compra <= CURRENT_DATE - INTERVAL '90 days';
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 90);
    const fechaSql = fechaLimite.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const { data, error } = await pool.from('clientes').select('*').lte('ultima_compra', fechaSql);
    if (error) throw new Error('Error al buscar clientes inactivos: ' + error.message);
    return data;
};

export const getClientesEnPromocion = async () => {
    // SELECT * FROM clientes WHERE es_promocion = true;
    const { data, error } = await pool
        .from('clientes')
        .select('*')
        .eq('es_promocion', true);
        
    if (error) throw new Error('Error al obtener clientes en promoción: ' + error.message);
    return data;
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
