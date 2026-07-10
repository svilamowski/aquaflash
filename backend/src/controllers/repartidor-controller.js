import { Router } from "express";
import RepartidorService from '../services/repartidor-service.js';

const router = Router();
const svc = new RepartidorService();
let returnData;

// Obtener todos los repartidores
router.get('/', async (req, res) => {
    try {
        returnData = await svc.getAllRepartidores();
        res.status(200).send(returnData);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener los repartidores', error: error.message });
    }
});

// Obtener un repartidor específico por su ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        returnData = await svc.getRepartidorById(id);
        
        // Si la base de datos no encuentra al repartidor, devolvemos un 404
        if (!returnData) {
            return res.status(404).json({ message: 'Repartidor no encontrado' });
        }
        
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el repartidor', error: error.message });
    }
});

// Crear un nuevo repartidor
router.post('/create', async (req, res) => {
    try {
        // Obtenemos los datos del repartidor desde el body (esperamos que contenga al menos { "nombre": "..." })
        const repartidorData = req.body;
        
        returnData = await svc.createRepartidor(repartidorData);
        res.status(201).send(returnData); // 201 Created indica que el recurso fue creado exitosamente
    } catch (error) {
        // Captura el error si falta el nombre (que definiste en el service)
        res.status(400).json({ message: 'Error al crear el repartidor', error: error.message });
    }
});

// Eliminar un repartidor
router.delete('/:id/delete', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const success = await svc.deleteRepartidor(id);
        res.status(200).send(success);
    } catch (error) {
        res.status(400).json({ message: 'Error al eliminar el repartidor', error: error.message });
    }
});

export default router;