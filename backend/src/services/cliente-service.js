import ClienteRepository from '../repositories/cliente-repository.js';

export default class ClienteService {
    constructor() {
        this.clienteRepo = new ClienteRepository();
    }

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

    createCliente = async (datosCliente) => {
        datosCliente.deuda = 0;
        datosCliente.fecha_creacion = new Date().toISOString();
        
        const returnArray = await this.clienteRepo.createCliente(datosCliente);
        return returnArray;
    }

    alterCliente = async (entity) => {
        if (!entity.id) throw new Error('Se necesita el ID para actualizar el cliente');
        
        // El repositorio de Supabase ignora automáticamente los campos que estén vacíos
        const returnData = await this.clienteRepo.alterCliente(entity);
        return returnData;
    }

    deleteCliente = async (id) => {
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
        const returnData = await this.clienteRepo.alterNotaInterna(entity);
        return returnData;
    }
}