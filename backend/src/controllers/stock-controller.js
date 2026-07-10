import { Router } from "express";
import StockService from '../services/stock-service.js';

const router = Router();
const svc = new StockService();
let returnData;

// Obtener resumen de stock (fábrica + casas por producto)
router.get('/resumen', async (req, res) => {
    try {
        returnData = await svc.getStockResumen();
        res.status(200).send(returnData);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el resumen de stock', error: error.message });
    }
});

// Comprar stock (suma cantidad a fábrica)
router.put('/fabrica/:productoId/comprar', async (req, res) => {
    try {
        const productoId = parseInt(req.params.productoId);
        const cantidad = parseInt(req.body.cantidad);
        returnData = await svc.comprarStock(productoId, cantidad);
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al comprar stock', error: error.message });
    }
});

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

        returnData = await svc.updateStockCantidad(productoId, req.body);
        res.status(200).send(returnData);
    } catch (error) {
        // Captura errores como enviar una nuevaCantidad nula o un productoId inválido
        res.status(400).json({ message: 'Error al actualizar el stock', error: error.message });
    }
});

// Descartar stock de un producto (resta la cantidad indicada)
router.put('/fabrica/descarte', async (req, res) => {
    try {
        returnData = await svc.descartarStock(req.body);
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al registrar el descarte', error: error.message });
    }
});

export default router;