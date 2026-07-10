import RepartidorRepository from '../repositories/repartidor-repository.js';

export default class RepartidorService {
    constructor() {
        this.repartidorRepo = new RepartidorRepository();
    }

    getAllRepartidores = async () => {
        const returnData = await this.repartidorRepo.getAllRepartidores();
        return returnData;
    }

    getRepartidorById = async (id) => {
        if (!id) {
            throw new Error('El ID del repartidor es obligatorio');
        }
        const returnData = await this.repartidorRepo.getRepartidorById(id);
        return returnData;
    }

    createRepartidor = async (repartidorData) => {
        if (!repartidorData || !repartidorData.nombre) {
            throw new Error('El nombre del repartidor es obligatorio');
        }
        const returnData = await this.repartidorRepo.createRepartidor(repartidorData);
        return returnData;
    }

    deleteRepartidor = async (id) => {
        if (!id) {
            throw new Error('El ID del repartidor es obligatorio para eliminarlo');
        }
        const success = await this.repartidorRepo.deleteRepartidor(id);
        return success;
    }
}