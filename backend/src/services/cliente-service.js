import ClienteRepository from '../repositories/cliente-repository.js';
import ProductoRepository from '../repositories/producto-repository.js';
import StockRepository from '../repositories/stock-repository.js';

const NOMBRE_DISPENSER = 'Dispenser Frío/Calor';

export default class ClienteService {
    constructor() {
        this.clienteRepo = new ClienteRepository();
        this.productoRepo = new ProductoRepository();
        this.stockRepo = new StockRepository();
    }

    obtenerIdDispenser = async () => {
        const producto = await this.productoRepo.getProductoByNombre(NOMBRE_DISPENSER);
        if (!producto) throw new Error('No se encontró el producto dispenser en el sistema');
        return producto.id;
    };

    asignarDispenser = async (clienteId) => {
        const productoId = await this.obtenerIdDispenser();
        await this.stockRepo.ajustarStockPorVenta(productoId, 1, 0);
        await this.clienteRepo.asignarProductoCliente(clienteId, productoId, 1);
    };

    devolverDispenser = async (clienteId) => {
        const productoId = await this.obtenerIdDispenser();
        const cantidad = await this.clienteRepo.getCantidadProductoCliente(clienteId, productoId);
        if (cantidad <= 0) return;

        await this.stockRepo.ajustarStockPorVenta(productoId, 0, 1);
        await this.clienteRepo.quitarProductoCliente(clienteId, productoId, 1);
    };

    getAllClientes = async () => {
        const returnArray = await this.clienteRepo.getAllClientes();
        return returnArray;
    }

    getStockEnCasa = async (clienteId) => {
        if (!clienteId) throw new Error('El ID del cliente es obligatorio');
        const stock = await this.clienteRepo.getStockEnCasa(clienteId);
        return stock;
    }

    getClienteById = async (id) => {
        const returnArray = await this.clienteRepo.getClienteById(id);
        return returnArray;
    }

    clienteTieneDispenser = async (clienteId) => {
        const productoId = await this.obtenerIdDispenser();
        const cantidad = await this.clienteRepo.getCantidadProductoCliente(clienteId, productoId);
        return cantidad > 0;
    };

    createCliente = async (datosCliente) => {
        const tieneDispenser = Boolean(datosCliente.tiene_dispenser);
        delete datosCliente.tiene_dispenser;

        datosCliente.deuda = 0;
        datosCliente.fecha_creacion = new Date().toISOString();

        if (datosCliente.es_promocion && !datosCliente.fecha_inicio_promo) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            datosCliente.fecha_inicio_promo = hoy.toISOString();
        }

        const cliente = await this.clienteRepo.createCliente(datosCliente);

        if (tieneDispenser) {
            await this.asignarDispenser(cliente.id);
        }

        return cliente;
    }

    alterCliente = async (entity) => {
        if (!entity.id) throw new Error('Se necesita el ID para actualizar el cliente');

        const tieneDispenser = entity.tiene_dispenser;
        delete entity.tiene_dispenser;

        const clienteAnterior = await this.clienteRepo.getClienteById(entity.id);

        if (entity.es_promocion && !clienteAnterior.es_promocion && !entity.fecha_inicio_promo) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            entity.fecha_inicio_promo = hoy.toISOString();
        }

        const returnData = await this.clienteRepo.alterCliente(entity);

        if (tieneDispenser !== undefined) {
            const tieneActualmente = await this.clienteTieneDispenser(entity.id);
            if (tieneDispenser && !tieneActualmente) {
                await this.asignarDispenser(entity.id);
            } else if (!tieneDispenser && tieneActualmente) {
                await this.devolverDispenser(entity.id);
            }
        }

        return returnData;
    }

    deleteCliente = async (id) => {
        await this.devolverDispenser(id);
        const returnArray = await this.clienteRepo.deleteCliente(id);
        return returnArray;
    }

    getClientesByNombre = async (nombre) => {
        if (!nombre) return await this.getAllClientes();
        const returnArray = await this.clienteRepo.getClientesByNombre(nombre);
        return returnArray;
    }

    getClientesByDireccion = async (direccion) => {
        const returnArray = await this.clienteRepo.getClientesByDireccion(direccion);
        return returnArray;
    }

    getClientesByFrecuencia = async (frecuencia) => {
        const returnArray = await this.clienteRepo.getClientesByFrecuencia(frecuencia);
        return returnArray;
    }

    getClientesByRepartidor = async (repartidorId) => {
        const returnArray = await this.clienteRepo.getClientesByRepartidor(repartidorId);
        return returnArray;
    }

    getClientesByDeuda = async () => {
        const returnArray = await this.clienteRepo.getClientesByDeuda();
        return returnArray;
    }

    getClientesByUltimaCompra = async () => {
        const returnArray = await this.clienteRepo.getClientesByUltimaCompra();
        return returnArray;
    }

    getClientesEnPromocion = async () => {
        const returnArray = await this.clienteRepo.getClientesEnPromocion();
        return returnArray;
    }

    getNotaInterna = async (clienteId) => {
        const nota = await this.clienteRepo.getNotaInterna(clienteId);
        return nota;
    }

    alterNotaInterna = async (entity) => {
        if (!entity.cliente_id) throw new Error('Falta el ID del cliente para la nota');
        const returnData = await this.clienteRepo.alterNotaInterna(entity.cliente_id, entity.nota);
        return returnData;
    }
}
