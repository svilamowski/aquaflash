import { Router } from "express";
import FiltroService from '../services/filtro-service.js';

const router = Router();
const svc = new FiltroService();
let returnArray;

// Obtener todos los filtros
router.get('/', async (req, res) => {
    try {
        returnArray = await svc.getAllFiltros();
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener los filtros', error: error.message });
    }
});

// Crear un nuevo filtro
router.post('/create', async (req, res) => {
    try {
        const entity = req.body;

        returnArray = await svc.createFiltro(entity);
        res.status(201).send(returnArray); // 201 Created
    } catch (error) {
        // Si el servicio tira el error de "nombre vacío", cae aquí con un 400 Bad Request
        res.status(400).json({ message: 'Error al crear el filtro', error: error.message });
    }
});

// Obtener todos los clientes que tienen un filtro específico
router.get('/:id/clientes', async (req, res) => {
    try {
        const filtroId = parseInt(req.params.id);
        returnArray = await svc.getClientesByFiltro(filtroId);
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener clientes por filtro', error: error.message });
    }
});

// Asignar un filtro a un cliente (Unir)
router.post('/:filtroId/cliente/:clienteId', async (req, res) => {
    try {
        const filtroId = parseInt(req.params.filtroId);
        const clienteId = parseInt(req.params.clienteId);
        
        const returnData = await svc.createFiltroACliente(clienteId, filtroId);
        res.status(201).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al asignar el filtro al cliente', error: error.message });
    }
});

// Remover un filtro de un cliente (Separar)
router.delete('/:filtroId/cliente/:clienteId/delete', async (req, res) => {
    try {
        const filtroId = parseInt(req.params.filtroId);
        const clienteId = parseInt(req.params.clienteId);
        
        const success = await svc.deleteFiltroDeCliente(clienteId, filtroId);
        res.status(200).send(success);
    } catch (error) {
        res.status(400).json({ message: 'Error al desvincular el filtro del cliente', error: error.message });
    }
});

export default router;