import pool from '../database/pool.js';

export const getClavesExistentes = async () => {
    const { rows } = await pool.query('SELECT clave FROM notificaciones');
    return rows.map((n) => n.clave).filter(Boolean);
};

export const getAllNotificaciones = async () => {
    const { rows } = await pool.query(
        'SELECT * FROM notificaciones ORDER BY fecha DESC'
    );
    return rows;
};

export const getNotificacionesNoLeidas = async () => {
    const { rows } = await pool.query(
        'SELECT * FROM notificaciones WHERE leido = false'
    );
    return rows;
};

export const updateNotificacionLeida = async (id) => {
    const { rows } = await pool.query(
        `UPDATE notificaciones SET leido = true
         WHERE id = $1
         RETURNING *`,
        [id]
    );
    return rows;
};

export const createNotificacion = async (notificacionData) => {
    const mensaje = notificacionData.mensaje;
    const leido = notificacionData.leido ?? false;
    const fecha = notificacionData.fecha ?? new Date().toISOString();
    const clave = notificacionData.clave ?? null;
    const id = notificacionData.id ?? null;

    if (id) {
        const { rows } = await pool.query(
            `INSERT INTO notificaciones (id, mensaje, leido, fecha, clave)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, mensaje, leido, fecha, clave]
        );
        return rows;
    }

    const { rows } = await pool.query(
        `INSERT INTO notificaciones (mensaje, leido, fecha, clave)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [mensaje, leido, fecha, clave]
    );
    return rows;
};

export default class NotificacionRepository {
    getClavesExistentes = getClavesExistentes;
    getAllNotificaciones = getAllNotificaciones;
    getNotificacionesNoLeidas = getNotificacionesNoLeidas;
    updateNotificacionLeida = updateNotificacionLeida;
    createNotificacion = createNotificacion;
}