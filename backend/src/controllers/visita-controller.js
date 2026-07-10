import { Router } from "express";
import VisitaService from '../services/visita-service.js';

const router = Router();
const svc = new VisitaService();
let returnData;

// Obtener historial de visitas de un cliente (ordenado por fecha)
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const clienteId = parseInt(req.params.clienteId);

        returnData = await svc.getVisitasByCliente(clienteId);
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el historial de visitas', error: error.message });
    }
});

// Obtener las visitas de hoy para un repartidor específico
router.get('/hoy/repartidor/:repartidorId', async (req, res) => {
    try {
        const repartidorId = parseInt(req.params.repartidorId);
        
        returnData = await svc.getVisitasDeHoyByRepartidor(repartidorId);
        res.status(200).send(returnData);
    } catch (error) {
        // Captura errores como la falta del ID del repartidor
        res.status(400).json({ message: 'Error al obtener las visitas de hoy', error: error.message });
    }
});

// Crear una nueva visita (cabecera)
router.post('/create', async (req, res) => {
    try {
        // Extraemos los datos de la visita del cuerpo de la petición (debe incluir cliente_id y repartidor_id)
        const visitaData = req.body;
        
        returnData = await svc.createVisita(visitaData);
        res.status(201).send(returnData); // 201 Created
    } catch (error) {
        res.status(400).json({ message: 'Error al registrar la visita', error: error.message });
    }
});

// Registrar los productos vendidos en una visita (detalle)
router.post('/ventas/create', async (req, res) => {
    try {
        // En este caso, esperamos que el frontend envíe directamente un arreglo de objetos en el body
        const ventasArray = req.body;
        
        returnData = await svc.createVentasProductos(ventasArray);
        res.status(201).send(returnData); // 201 Created
    } catch (error) {
        // Capturamos el error si el arreglo viene vacío o no tiene el formato correcto
        res.status(400).json({ message: 'Error al registrar las ventas de los productos', error: error.message });
    }
});

export default router;