import StockRepository from '../repositories/stock-repository.js';

export default class StockService {
    constructor() {
        this.stockRepo = new StockRepository();
    }

    getStockFabrica = async () => {
        const returnData = await this.stockRepo.getStockFabrica();
        return returnData;
    }

    updateStockCantidad = async (productoId, entity) => {
        if (!productoId) {
            throw new Error('El ID del producto es obligatorio para actualizar el stock');
        }
        if (entity.cantidad === undefined || entity.cantidad === null) {
            throw new Error('La nueva cantidad es obligatoria');
        }
        const returnData = await this.stockRepo.updateStockCantidad(productoId, entity.cantidad);
        return returnData;
    }

    descartarStock = async (entity) => {
        if (!entity?.producto_id || entity.cantidad === undefined || entity.cantidad === null) {
            throw new Error('Faltan datos obligatorios para el descarte (producto_id, cantidad)');
        }
        if (entity.cantidad <= 0) {
            throw new Error('La cantidad a descartar debe ser mayor a 0');
        }
        const returnData = await this.stockRepo.descartarStock(entity.producto_id, entity.cantidad);
        return returnData;
    }
}