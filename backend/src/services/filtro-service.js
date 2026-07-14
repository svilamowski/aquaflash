import FiltroRepository from '../repositories/filtro-repository.js';

export default class FiltroService {
    constructor() {
        this.filtroRepo = new FiltroRepository();
    }

    getAllFiltros = async () => {
        const returnArray = await this.filtroRepo.getAllFiltros();
        return returnArray;
    }

    getClientesByFiltro = async (filtroId) => {
        if (!filtroId) throw new Error('El ID del filtro es obligatorio');
        
        const returnArray = await this.filtroRepo.getClientesByFiltro(filtroId);
        return returnArray;
    }

    createFiltro = async (entity) => {
        const nombre = entity.nombre ?? entity.nombreFiltro;
        if (!nombre || nombre.trim() === '') {
            throw new Error('El nombre del filtro no puede estar vacío');
        }

        const returnData = await this.filtroRepo.createFiltro({
            id: entity.id,
            nombre: nombre.trim(),
        });
        return returnData;
    }

    createFiltroACliente = async (clienteId, filtroId) => {
        if (!clienteId || !filtroId) {
            throw new Error('Se necesitan tanto el ID del cliente como el ID del filtro para unirlos');
        }
        
        const returnData = await this.filtroRepo.createFiltroACliente(clienteId, filtroId);
        return returnData;
    }

    deleteFiltroDeCliente = async (clienteId, filtroId) => {
        if (!clienteId || !filtroId) {
            throw new Error('Se necesitan tanto el ID del cliente como el ID del filtro para separarlos');
        }
        
        const success = await this.filtroRepo.deleteFiltroDeCliente(clienteId, filtroId);
        return success;
    }

    alterFiltro = async (filtroId, entity) => {
        if (!filtroId) throw new Error('El ID del filtro es obligatorio');

        const nombre = entity.nombre ?? entity.nombreFiltro;
        if (!nombre || nombre.trim() === '') {
            throw new Error('El nombre del filtro no puede estar vacío');
        }

        return this.filtroRepo.alterFiltro(filtroId, { nombre: nombre.trim() });
    }

    deleteFiltro = async (filtroId) => {
        if (!filtroId) throw new Error('El ID del filtro es obligatorio para eliminarlo');
        return this.filtroRepo.deleteFiltro(filtroId);
    }
}