import StockRepository from '../repositories/stock-repository.js';
import ProductoRepository from '../repositories/producto-repository.js';
import { sincronizarNotificaciones } from './notificacion-reglas-service.js';

export default class StockService {
    constructor() {
        this.stockRepo = new StockRepository();
        this.productoRepo = new ProductoRepository();
    }

    getStockResumen = async () => {
        const [productos, fabrica, casas] = await Promise.all([
            this.productoRepo.getAllProductos(),
            this.stockRepo.getStockFabrica(),
            this.stockRepo.getStockEnCasas(),
        ]);

        const fabricaPorProducto = Object.fromEntries(
            fabrica.map((f) => [f.producto_id, f.cantidad])
        );

        return productos.map((p) => {
            const enFabrica = fabricaPorProducto[p.id] ?? 0;
            const enCasas = casas[p.id] ?? 0;
            return {
                id: p.id,
                nombre: p.nombre,
                precio: p.precio,
                cantidad_minima_fabrica: p.cantidad_minima_fabrica,
                en_fabrica: enFabrica,
                en_casas: enCasas,
                total: enFabrica + enCasas,
            };
        });
    }

    comprarStock = async (productoId, cantidad) => {
        if (!productoId) throw new Error('El ID del producto es obligatorio');
        if (!cantidad || cantidad <= 0) throw new Error('La cantidad a comprar debe ser mayor a 0');

        const fabrica = await this.stockRepo.getStockFabrica();
        const item = fabrica.find((f) => f.producto_id === productoId);
        if (!item) throw new Error('No se encontró stock de fábrica para ese producto');

        const result = await this.stockRepo.updateStockCantidad(productoId, item.cantidad + cantidad);
        await sincronizarNotificaciones();
        return result;
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
        await sincronizarNotificaciones();
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
        await sincronizarNotificaciones();
        return returnData;
    }
}