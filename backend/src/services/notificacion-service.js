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

    createNotificacion = async (mensaje) => {
        if (!mensaje || mensaje.trim() === '') {
            throw new Error('El mensaje de la notificación no puede estar vacío');
        }
        const returnData = await this.notificacionRepo.createNotificacion(mensaje.trim());
        return returnData;
    }
}