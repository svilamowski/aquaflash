import ProductoRepository from '../repositories/producto-repository.js';

export default class ProductoService {
    constructor() {
        this.productoRepo = new ProductoRepository();
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
        const returnData = await this.productoRepo.createProducto(productoData);
        return returnData;
    }

    deleteProducto = async (id) => {
        if (!id) {
            throw new Error('El ID del producto es obligatorio para eliminarlo');
        }
        const success = await this.productoRepo.deleteProducto(id);
        return success;
    }
}