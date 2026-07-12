import pool from '../database/pool.js';

export const getClientesByFiltro = async (filtroId) => {
    // SELECT * FROM clientes c
    // INNER JOIN clientes_filtros cf on cf.cliente_id = c.id
    // INNER JOIN filtros_personalizados fp on cf.filtro_id = fp.id
    // WHERE fp.id = $1
    const { data, error } = await pool
        .from('clientes_filtros')
        .select('clientes(*)')
        .eq('filtro_id', filtroId);
        
    if (error) throw new Error('Error al filtrar clientes: ' + error.message);
    // Supabase devuelve [{ clientes: {id: 1...} }]. Lo mapeamos para que devuelva solo el array de clientes:
    return data.map(item => item.clientes);
};

export const getAllFiltros = async () => {
    // SELECT *
    // FROM filtros_personalizados;
    const { data, error } = await pool.from('filtros_personalizados').select('*');
    if (error) throw new Error('Error al obtener los filtros: ' + error.message);
    return data;
};

export const createFiltro = async (filtroData) => {
    // INSERT INTO filtros_personalizados (nombre)
    // VALUES ($1)
    // RETURNING *;
    const payload = { nombre: filtroData.nombre };
    if (filtroData.id) payload.id = filtroData.id;

    const { data, error } = await pool
        .from('filtros_personalizados')
        .insert([payload])
        .select();
        
    if (error) throw new Error('Error al crear filtro: ' + error.message);
    return data;
};

export const createFiltroACliente = async (clienteId, filtroId) => {
    // INSERT INTO clientes_filtros (cliente_id, filtro_id)
    // VALUES ($1, $2)
    // RETURNING *;
    const { data, error } = await pool
        .from('clientes_filtros')
        .insert([{ cliente_id: clienteId, filtro_id: filtroId }])
        .select();

    if (error) {
        if (error.code === '23505') {
            return [{ cliente_id: clienteId, filtro_id: filtroId }];
        }
        throw new Error('Error al asignar filtro al cliente: ' + error.message);
    }
    return data;
};

export const deleteFiltroDeCliente = async (clienteId, filtroId) => {
    // DELETE FROM clientes_filtros
    // WHERE cliente_id = $1 AND filtro_id = $2;
    const { error } = await pool
        .from('clientes_filtros')
        .delete()
        .match({ cliente_id: clienteId, filtro_id: filtroId });
        
    if (error) throw new Error('Error al remover el filtro: ' + error.message);
    return true;
};

export default class FiltroRepository {
    getClientesByFiltro = getClientesByFiltro;
    getAllFiltros = getAllFiltros;
    createFiltro = createFiltro;
    createFiltroACliente = createFiltroACliente;
    deleteFiltroDeCliente = deleteFiltroDeCliente;
}