import EstadisticasRepository from '../repositories/estadisticas-repository.js';

export default class EstadisticasService {
    constructor() {
        this.estadisticasRepo = new EstadisticasRepository();
    }
    getVentasFiltradas = async (fechaInicio, fechaFin, repartidorId = null) => {
        if (!fechaInicio || !fechaFin) {
            throw new Error('Las fechas de inicio y fin son obligatorias para filtrar las ventas');
        }
        const returnData = await this.estadisticasRepo.getVentasFiltradas(fechaInicio, fechaFin, repartidorId);
        return returnData;
    }

    getClientesNuevosFiltrados = async (fechaInicio, fechaFin, repartidorId = null) => {
        if (!fechaInicio || !fechaFin) {
            throw new Error('Las fechas de inicio y fin son obligatorias para filtrar clientes nuevos');
        }
        const returnData = await this.estadisticasRepo.getClientesNuevosFiltrados(fechaInicio, fechaFin, repartidorId);
        return returnData;
    }

    getEstadoDeudasYPromos = async (repartidorId = null) => {
        const returnData = await this.estadisticasRepo.getEstadoDeudasYPromos(repartidorId);
        return returnData;
    }
}