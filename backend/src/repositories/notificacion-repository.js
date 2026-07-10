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

export const createNotificacion = async (notificacionData) => {
    // INSERT INTO notificaciones (mensaje, leido, fecha)
    // VALUES ($1, $2, $3)
    // RETURNING *;
    const payload = {
        mensaje: notificacionData.mensaje,
        leido: notificacionData.leido ?? false,
        fecha: notificacionData.fecha ?? new Date().toISOString(),
    };
    if (notificacionData.id) payload.id = notificacionData.id;

    const { data, error } = await pool.from('notificaciones').insert([payload]).select();
    if (error) throw new Error('Error al crear notificación: ' + error.message);
    return data;
};

export default class NotificacionRepository {
    getNotificacionesNoLeidas = getNotificacionesNoLeidas;
    updateNotificacionLeida = updateNotificacionLeida;
    createNotificacion = createNotificacion;
}