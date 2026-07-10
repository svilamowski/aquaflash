import { Router } from "express";
import NotificacionService from '../services/notificacion-service.js';

const router = Router();
const svc = new NotificacionService();
let returnArray;

// Obtener todas las notificaciones
router.get('/', async (req, res) => {
    try {
        returnArray = await svc.getAllNotificaciones();
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener las notificaciones', error: error.message });
    }
});

// Obtener todas las notificaciones no leídas
router.get('/no-leidas', async (req, res) => {
    try {
        returnArray = await svc.getNotificacionesNoLeidas();
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener las notificaciones', error: error.message });
    }
});

// Crear una nueva notificación
router.post('/create', async (req, res) => {
    try {
        const entity = req.body;
        if (!entity) {
            return res.status(400).json({
                message: 'Error al crear la notificación',
                error: 'El cuerpo de la petición es requerido (usá Content-Type: application/json)',
            });
        }

        const returnData = await svc.createNotificacion(entity);
        res.status(201).send(returnData); // 201 Created
    } catch (error) {
        // Si el mensaje viene vacío, el servicio lanzará un error capturado aquí (400 Bad Request)
        res.status(400).json({ message: 'Error al crear la notificación', error: error.message });
    }
});

// Marcar una notificación específica como leída
router.put('/:id/marcar-leida', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const returnData = await svc.updateNotificacionLeida(id);
        res.status(200).send(returnData);
    } catch (error) {
        // Si no se envía el ID o hay un error en la base de datos, devuelve un 400
        res.status(400).json({ message: 'Error al actualizar la notificación', error: error.message });
    }
});

export default router;