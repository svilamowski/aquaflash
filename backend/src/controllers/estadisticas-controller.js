import { Router } from 'express';
import EstadisticasService from '../services/estadisticas-service.js';

const router = Router();
const svc = new EstadisticasService();

router.get('/resumen', async (req, res) => {
    try {
        const periodo = req.query.periodo || 'mes';
        const repartidorId = req.query.repartidor_id || null;
        const data = await svc.getResumen(periodo, repartidorId);
        res.status(200).send(data);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
});

export default router;
