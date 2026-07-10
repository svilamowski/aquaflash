import { Router } from "express";
import ClienteService from '../services/cliente-service.js';

const router = Router();
const svc = new ClienteService();
let returnArray;

// Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        returnArray = await svc.getAllClientes();
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
});

// Filtrar clientes con deuda
router.get('/deuda', async (req, res) => { 
    returnArray = await svc.getClientesByDeuda();
    res.status(200).send(returnArray);   
});

// Filtrar clientes por última compra
router.get('/ultima_compra', async (req, res) => { 
    returnArray = await svc.getClientesByUltimaCompra();
    res.status(200).send(returnArray);   
});

// Filtrar clientes en promoción
router.get('/promocion', async (req, res) => { 
    returnArray = await svc.getClientesEnPromocion();
    res.status(200).send(returnArray);   
});

// Búsqueda por nombre
router.get('/nombre/:nombre', async (req, res) => { 
    const nombre = req.params.nombre;
    returnArray = await svc.getClientesByNombre(nombre);
    res.status(200).send(returnArray);   
});

// Búsqueda por dirección
router.get('/direccion/:direccion', async (req, res) => { 
    const direccion = req.params.direccion;
    returnArray = await svc.getClientesByDireccion(direccion);
    res.status(200).send(returnArray);   
});

// Búsqueda por frecuencia
router.get('/frecuencia/:frecuencia', async (req, res) => { 
    const frecuencia = req.params.frecuencia;
    returnArray = await svc.getClientesByFrecuencia(frecuencia);
    res.status(200).send(returnArray);   
});

// Búsqueda por repartidor
router.get('/repartidor/:repartidorId', async (req, res) => { 
    const repartidorId = parseInt(req.params.repartidorId);
    returnArray = await svc.getClientesByRepartidor(repartidorId);
    res.status(200).send(returnArray);   
});

// Crear un nuevo cliente
router.post('/create', async (req, res) => {
    try {
        const datosCliente = req.body;
        returnArray = await svc.createCliente(datosCliente);
        res.status(201).send(returnArray); // 201 Created
    } catch (error) {
        res.status(400).json({ message: 'Error al crear cliente', error: error.message });
    }
});

// Obtener un cliente por su ID
router.get('/:id', async (req, res) => { 
    const id = parseInt(req.params.id);
    returnArray = await svc.getClienteById(id);
    res.status(200).send(returnArray);   
});

// Actualizar un cliente
router.put('/:id/alter', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const entity = req.body;
        // Nos aseguramos de que el ID vaya en la entidad que espera el servicio
        entity.id = id; 
        
        returnArray = await svc.alterCliente(entity);
        res.status(200).send(returnArray);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar cliente', error: error.message });
    }
});

// Eliminar un cliente
router.delete('/:id/delete', async (req, res) => { 
    const id = parseInt(req.params.id);
    returnArray = await svc.deleteCliente(id);
    res.status(200).send(returnArray);   
});

// Obtener el stock en casa de un cliente
router.get('/:id/stock', async (req, res) => { 
    try {
        const id = parseInt(req.params.id);
        const stock = await svc.getStockEnCasa(id);
        res.status(200).send(stock);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el stock', error: error.message });
    }
});

// Obtener la nota interna de un cliente
router.get('/:id/nota', async (req, res) => { 
    const id = parseInt(req.params.id);
    const nota = await svc.getNotaInterna(id);
    res.status(200).send(nota);   
});

// Actualizar la nota interna de un cliente
router.put('/:id/nota/alter', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const entity = req.body;
        // Asignamos el cliente_id a la entidad para que el servicio no falle
        entity.cliente_id = id; 
        
        const returnData = await svc.alterNotaInterna(entity);
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar la nota interna', error: error.message });
    }
});

export default router;