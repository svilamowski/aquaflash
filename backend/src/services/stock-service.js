import StockRepository from '../repositories/stock-repository.js';

export default class StockService {
    constructor() {
        this.stockRepo = new StockRepository();
    }

    getStockFabrica = async () => {
        const returnData = await this.stockRepo.getStockFabrica();
        return returnData;
    }

    updateStockCantidad = async (productoId, nuevaCantidad) => {
        if (!productoId) {
            throw new Error('El ID del producto es obligatorio para actualizar el stock');
        }
        if (nuevaCantidad === undefined || nuevaCantidad === null) {
            throw new Error('La nueva cantidad es obligatoria');
        }
        const returnData = await this.stockRepo.updateStockCantidad(productoId, nuevaCantidad);
        return returnData;
    }

    createDescartado = async (descarteData) => {
        if (!descarteData || !descarteData.producto_id || !descarteData.cantidad) {
            throw new Error('Faltan datos obligatorios para registrar el descarte (producto_id, cantidad)');
        }
        const returnData = await this.stockRepo.createDescartado(descarteData);
        return returnData;
    }
}