import VisitaRepository from '../repositories/visita-repository.js';

export default class VisitaService {
    constructor() {
        this.visitaRepo = new VisitaRepository();
    }

    createVisita = async (visitaData) => {
        if (!visitaData || !visitaData.cliente_id || !visitaData.repartidor_id) {
            throw new Error('Faltan datos clave para crear la visita (cliente_id, repartidor_id)');
        }
        const returnData = await this.visitaRepo.createVisita(visitaData);
        return returnData;
    }

    createVentasProductos = async (ventasArray) => {
        if (!ventasArray || !Array.isArray(ventasArray) || ventasArray.length === 0) {
            throw new Error('El arreglo de ventas no puede estar vacío');
        }
        const returnData = await this.visitaRepo.createVentasProductos(ventasArray);
        return returnData;
    }

    getVisitasDeHoyByRepartidor = async (repartidorId) => {
        if (!repartidorId) {
            throw new Error('El ID del repartidor es obligatorio para buscar las visitas');
        }
        const returnData = await this.visitaRepo.getVisitasDeHoyByRepartidor(repartidorId);
        return returnData;
    }
}