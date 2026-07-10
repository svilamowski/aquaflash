import ProductoRepository from '../repositories/producto-repository.js';
import StockRepository from '../repositories/stock-repository.js';
import { sincronizarNotificaciones } from './notificacion-reglas-service.js';

export default class ProductoService {
    constructor() {
        this.productoRepo = new ProductoRepository();
        this.stockRepo = new StockRepository();
    }

    getAllProductos = async () => {
        const returnData = await this.productoRepo.getAllProductos();
        return returnData;
    }

    getProductoById = async (id) => {
        if (!id) {
            throw new Error('El ID del producto es obligatorio');
        }
        const returnData = await this.productoRepo.getProductoById(id);
        return returnData;
    }

    createProducto = async (productoData) => {
        if (!productoData || !productoData.nombre) {
            throw new Error('Faltan datos obligatorios para crear el producto (ej. nombre)');
        }

        const cantidad = productoData.cantidad ?? 0;
        const producto = await this.productoRepo.createProducto({ ...productoData, cantidad });
        await this.stockRepo.createStockFabrica(producto.id, cantidad);
        await sincronizarNotificaciones();
        return producto;
    }

    deleteProducto = async (id) => {
        if (!id) {
            throw new Error('El ID del producto es obligatorio para eliminarlo');
        }
        const success = await this.productoRepo.deleteProducto(id);
        return success;
    }
}