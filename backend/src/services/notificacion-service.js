import NotificacionRepository from '../repositories/notificacion-repository.js';
import { sincronizarNotificaciones } from './notificacion-reglas-service.js';

export default class NotificacionService {
    constructor() {
        this.notificacionRepo = new NotificacionRepository();
    }

    getAllNotificaciones = async () => {
        await sincronizarNotificaciones();
        return this.notificacionRepo.getAllNotificaciones();
    }

    getNotificacionesNoLeidas = async () => {
        await sincronizarNotificaciones();
        return this.notificacionRepo.getNotificacionesNoLeidas();
    }

    updateNotificacionLeida = async (id) => {
        if (!id) {
            throw new Error('El ID de la notificación es obligatorio');
        }
        return this.notificacionRepo.updateNotificacionLeida(id);
    }

    createNotificacion = async (entity) => {
        if (!entity.mensaje || entity.mensaje.trim() === '') {
            throw new Error('El mensaje de la notificación no puede estar vacío');
        }

        const fecha = entity.fecha ? new Date(entity.fecha) : new Date();
        const fechaValida = isNaN(fecha.getTime()) ? new Date() : fecha;

        return this.notificacionRepo.createNotificacion({
            id: entity.id,
            clave: entity.clave,
            mensaje: entity.mensaje.trim(),
            leido: entity.leido ?? false,
            fecha: fechaValida.toISOString(),
        });
    }
}
