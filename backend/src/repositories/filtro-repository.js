import pool from '../database/pool.js';

export const getClientesByFiltro = async (filtroId) => {
    const { rows } = await pool.query(
        `SELECT c.*
         FROM clientes c
         INNER JOIN clientes_filtros cf ON cf.cliente_id = c.id
         WHERE cf.filtro_id = $1`,
        [filtroId]
    );
    return rows;
};

export const getAllFiltros = async () => {
    const { rows } = await pool.query('SELECT * FROM filtros_personalizados');
    return rows;
};

export const createFiltro = async (filtroData) => {
    if (filtroData.id) {
        const { rows } = await pool.query(
            `INSERT INTO filtros_personalizados (id, nombre)
             VALUES ($1, $2)
             RETURNING *`,
            [filtroData.id, filtroData.nombre]
        );
        return rows;
    }

    const { rows } = await pool.query(
        `INSERT INTO filtros_personalizados (nombre)
         VALUES ($1)
         RETURNING *`,
        [filtroData.nombre]
    );
    return rows;
};

export const createFiltroACliente = async (clienteId, filtroId) => {
    try {
        const { rows } = await pool.query(
            `INSERT INTO clientes_filtros (cliente_id, filtro_id)
             VALUES ($1, $2)
             RETURNING *`,
            [clienteId, filtroId]
        );
        return rows;
    } catch (error) {
        if (error.code === '23505') {
            return [{ cliente_id: clienteId, filtro_id: filtroId }];
        }
        throw new Error('Error al asignar filtro al cliente: ' + error.message);
    }
};

export const deleteFiltroDeCliente = async (clienteId, filtroId) => {
    await pool.query(
        `DELETE FROM clientes_filtros
         WHERE cliente_id = $1 AND filtro_id = $2`,
        [clienteId, filtroId]
    );
    return true;
};

export const alterFiltro = async (filtroId, filtroData) => {
    const { rows } = await pool.query(
        `UPDATE filtros_personalizados SET nombre = $1
         WHERE id = $2
         RETURNING *`,
        [filtroData.nombre, filtroId]
    );
    if (!rows[0]) throw new Error('Error al actualizar el filtro: Filtro no encontrado');
    return rows[0];
};

export const deleteFiltro = async (filtroId) => {
    await pool.query('DELETE FROM clientes_filtros WHERE filtro_id = $1', [filtroId]);
    await pool.query('DELETE FROM filtros_personalizados WHERE id = $1', [filtroId]);
    return true;
};

export default class FiltroRepository {
    getClientesByFiltro = getClientesByFiltro;
    getAllFiltros = getAllFiltros;
    createFiltro = createFiltro;
    createFiltroACliente = createFiltroACliente;
    deleteFiltroDeCliente = deleteFiltroDeCliente;
    alterFiltro = alterFiltro;
    deleteFiltro = deleteFiltro;
}