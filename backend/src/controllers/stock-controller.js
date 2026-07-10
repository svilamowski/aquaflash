import { Router } from "express";
import StockService from '../services/stock-service.js';

const router = Router();
const svc = new StockService();
let returnData;

// Obtener todo el stock de fábrica
router.get('/fabrica', async (req, res) => {
    try {
        returnData = await svc.getStockFabrica();
        res.status(200).send(returnData);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener el stock de fábrica', error: error.message });
    }
});

// Actualizar la cantidad de stock de un producto específico
router.put('/fabrica/:productoId/cantidad', async (req, res) => {
    try {
        const productoId = parseInt(req.params.productoId);
        // Extraemos 'nuevaCantidad' del cuerpo de la petición
        const { nuevaCantidad } = req.body; 
        
        returnData = await svc.updateStockCantidad(productoId, nuevaCantidad);
        res.status(200).send(returnData);
    } catch (error) {
        // Captura errores como enviar una nuevaCantidad nula o un productoId inválido
        res.status(400).json({ message: 'Error al actualizar el stock', error: error.message });
    }
});

// Registrar un producto descartado
router.post('/descarte', async (req, res) => {
    try {
        // Obtenemos todo el objeto del descarte (esperando producto_id y cantidad)
        const descarteData = req.body;
        
        returnData = await svc.createDescartado(descarteData);
        res.status(201).send(returnData); // 201 Created
    } catch (error) {
        res.status(400).json({ message: 'Error al registrar el descarte', error: error.message });
    }
});

export default router;