import pool from '../database/pool.js';

export const getAllRepartidores = async () => {
    // SELECT * FROM repartidores
    const { data, error } = await pool.from('repartidores').select('*');
    if (error) throw new Error('Error al obtener repartidores: ' + error.message);
    return data;
};

export const getRepartidorById = async (id) => {
    // SELECT * FROM repartidores 
    // WHERE id = $1
    const { data, error } = await pool.from('repartidores').select('*').eq('id', id).single();
    if (error) throw new Error('Error al obtener repartidor: ' + error.message);
    return data;
};

export const createRepartidor = async (repartidorData) => {
    // INSERT INTO repartidores (nombre) VALUES ($1) RETURNING *;
    const { data, error } = await pool
        .from('repartidores')
        .insert([repartidorData])
        .select()
        .single();
        
    if (error) throw new Error('Error al crear repartidor: ' + error.message);
    return data;
};

export const deleteRepartidor = async (id) => {
    // DELETE FROM repartidores WHERE id = $1;
    const { error } = await pool.from('repartidores').delete().eq('id', id);
    if (error) throw new Error('Error al eliminar repartidor: ' + error.message);
    return true;
};

export default class RepartidorRepository {
    getAllRepartidores = getAllRepartidores;
    getRepartidorById = getRepartidorById;
    createRepartidor = createRepartidor;
    deleteRepartidor = deleteRepartidor;
}