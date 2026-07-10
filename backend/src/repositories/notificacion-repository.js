import pool from '../database/pool.js';

export const getNotificacionesNoLeidas = async () => {
    // SELECT * FROM notificaciones WHERE leido = false
    const { data, error } = await pool.from('notificaciones').select('*').eq('leido', false);
    if (error) throw new Error('Error al buscar notificaciones: ' + error.message);
    return data;
};

export const updateNotificacionLeida = async (id) => {
    // UPDATE notificaciones SET leido = true WHERE id = $1
    const { data, error } = await pool.from('notificaciones').update({ leido: true }).eq('id', id).select();
    if (error) throw new Error('Error al actualizar notificación: ' + error.message);
    return data;
};

export const createNotificacion = async (mensaje) => {
    // INSERT INTO notificaciones (mensaje, leido)
    // VALUES ($1, false)
    // RETURNING *;
    const { data, error } = await pool.from('notificaciones').insert([{ mensaje, leido: false }]).select();
    if (error) throw new Error('Error al crear notificación: ' + error.message);
    return data;
};