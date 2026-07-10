import NotificacionRepository from '../repositories/notificacion-repository.js';

export default class NotificacionService {
    constructor() {
            this.notificacionRepo = new NotificacionRepository();
    }

    getNotificacionesNoLeidas = async () => {
        const returnData = await this.notificacionRepo.getNotificacionesNoLeidas();
        return returnData;
    }

    updateNotificacionLeida = async (id) => {
        if (!id) {
            throw new Error('El ID de la notificación es obligatorio');
        }
        const returnData = await this.notificacionRepo.updateNotificacionLeida(id);
        return returnData;
    }

    createNotificacion = async (entity) => {
        if (!entity.mensaje || entity.mensaje.trim() === '') {
            throw new Error('El mensaje de la notificación no puede estar vacío');
        }

        const fecha = entity.fecha ? new Date(entity.fecha) : new Date();
        const fechaValida = isNaN(fecha.getTime()) ? new Date() : fecha;

        const returnData = await this.notificacionRepo.createNotificacion({
            id: entity.id,
            mensaje: entity.mensaje.trim(),
            leido: entity.leido ?? false,
            fecha: fechaValida.toISOString(),
        });
        return returnData;
    }
}