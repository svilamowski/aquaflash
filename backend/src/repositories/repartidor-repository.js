import pool from '../database/pool.js';

export const getAllRepartidores = async () => {
    const { rows } = await pool.query('SELECT * FROM repartidores');
    return rows;
};

export const getRepartidorById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM repartidores WHERE id = $1', [id]);
    if (!rows[0]) throw new Error('Error al obtener repartidor: Repartidor no encontrado');
    return rows[0];
};

export const createRepartidor = async (repartidorData) => {
    const { rows } = await pool.query(
        'INSERT INTO repartidores (nombre) VALUES ($1) RETURNING *',
        [repartidorData.nombre]
    );
    return rows[0];
};

export const deleteRepartidor = async (id) => {
    await pool.query('DELETE FROM repartidores WHERE id = $1', [id]);
    return true;
};

export default class RepartidorRepository {
    getAllRepartidores = getAllRepartidores;
    getRepartidorById = getRepartidorById;
    createRepartidor = createRepartidor;
    deleteRepartidor = deleteRepartidor;
}