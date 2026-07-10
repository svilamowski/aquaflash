import { Router } from "express";
import ProductoService from '../services/producto-service.js';

const router = Router();
const svc = new ProductoService();
let returnData;

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        returnData = await svc.getAllProductos();
        res.status(200).send(returnData);
    } catch (error) {
        res.status(500).json({ message: 'Error interno al obtener los productos', error: error.message });
    }
});

// Obtener un producto específico por su ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        returnData = await svc.getProductoById(id);
        
        if (!returnData) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.status(200).send(returnData);
    } catch (error) {
        res.status(400).json({ message: 'Error al obtener el producto', error: error.message });
    }
});

// Crear un nuevo producto
router.post('/create', async (req, res) => {
    try {
        // Tomamos todo el objeto del cuerpo de la petición
        const productoData = req.body;
        
        returnData = await svc.createProducto(productoData);
        res.status(201).send(returnData); // 201 Created
    } catch (error) {
        // Si falta el nombre, el servicio tirará un error y caerá en este catch con un 400 Bad Request
        res.status(400).json({ message: 'Error al crear el producto', error: error.message });
    }
});

// Eliminar un producto
router.delete('/:id/delete', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const success = await svc.deleteProducto(id);
        res.status(200).send(success);
    } catch (error) {
        res.status(400).json({ message: 'Error al eliminar el producto', error: error.message });
    }
});

export default router;