import VisitaRepository from '../repositories/visita-repository.js';
import StockRepository from '../repositories/stock-repository.js';
import ProductoRepository from '../repositories/producto-repository.js';

const formatearProductos = (ventas, campoCantidad) => {
    if (!ventas?.length) return '-';

    return ventas
        .filter((venta) => venta[campoCantidad] > 0)
        .map((venta) => `${venta[campoCantidad]}x ${venta.productos.nombre}`)
        .join(', ');
};

export default class VisitaService {
    constructor() {
        this.visitaRepo = new VisitaRepository();
        this.stockRepo = new StockRepository();
        this.productoRepo = new ProductoRepository();
    }

    mapearProductosAVentas = async (visitaId, productos) => {
        const ventas = [];

        for (const item of productos) {
            let productoId = item.producto_id;

            if (!productoId) {
                const nombre = item.productos?.nombre ?? item.nombre;
                if (!nombre) {
                    throw new Error('Cada producto debe incluir producto_id o nombre');
                }
                const producto = await this.productoRepo.getProductoByNombre(nombre);
                if (!producto) {
                    throw new Error(`No se encontró el producto: ${nombre}`);
                }
                productoId = producto.id;
            }

            ventas.push({
                visita_id: visitaId,
                producto_id: productoId,
                cantidad_entregada: item.cantidad_entregada ?? 0,
                cantidad_retirada: item.cantidad_retirada ?? 0,
                precio_total_producto: item.precio_total_producto ?? 0,
            });
        }

        return ventas;
    }

    createVisita = async (visitaData) => {
        if (!visitaData?.cliente_id || !visitaData?.repartidor_id) {
            throw new Error('Faltan datos clave para crear la visita (cliente_id, repartidor_id)');
        }

        const { productos, entregado, retirado, id, ...cabecera } = visitaData;

        const montoTotalVenta = cabecera.monto_total_venta ?? productos?.reduce(
            (total, item) => total + (item.precio_total_producto ?? 0),
            0
        ) ?? 0;

        const fecha = cabecera.fecha ? new Date(cabecera.fecha) : new Date();
        const fechaValida = isNaN(fecha.getTime()) ? new Date() : fecha;

        const visitaPayload = {
            cliente_id: cabecera.cliente_id,
            repartidor_id: cabecera.repartidor_id,
            compro: cabecera.compro ?? false,
            monto_pagado: cabecera.monto_pagado ?? 0,
            monto_total_venta: montoTotalVenta,
            fecha: fechaValida.toISOString(),
        };
        if (id) visitaPayload.id = id;

        const visita = await this.visitaRepo.createVisita(visitaPayload);

        if (productos?.length) {
            const ventasArray = await this.mapearProductosAVentas(visita.id, productos);
            await this.createVentasProductos(ventasArray);
        }

        const historial = await this.visitaRepo.getVisitasByCliente(visita.cliente_id);
        const visitaCreada = historial.find((v) => v.id === visita.id);

        return {
            id: visitaCreada.id,
            fecha: visitaCreada.fecha,
            monto_pagado: visitaCreada.monto_pagado,
            compro: visitaCreada.compro,
            entregado: formatearProductos(visitaCreada.ventas_productos, 'cantidad_entregada'),
            retirado: formatearProductos(visitaCreada.ventas_productos, 'cantidad_retirada'),
            productos: visitaCreada.ventas_productos ?? [],
        };
    }

    createVentasProductos = async (ventasArray) => {
        if (!ventasArray || !Array.isArray(ventasArray) || ventasArray.length === 0) {
            throw new Error('El arreglo de ventas no puede estar vacío');
        }

        for (const venta of ventasArray) {
            if (!venta.producto_id) {
                throw new Error('Cada venta debe incluir producto_id');
            }
            if (!venta.visita_id) {
                throw new Error('Cada venta debe incluir visita_id');
            }
            await this.stockRepo.ajustarStockPorVenta(
                venta.producto_id,
                venta.cantidad_entregada,
                venta.cantidad_retirada
            );
        }

        const returnData = await this.visitaRepo.createVentasProductos(ventasArray);
        return returnData;
    }

    getVisitasByCliente = async (clienteId) => {
        if (!clienteId) {
            throw new Error('El ID del cliente es obligatorio para buscar el historial');
        }

        const visitas = await this.visitaRepo.getVisitasByCliente(clienteId);

        return visitas.map((visita) => ({
            id: visita.id,
            fecha: visita.fecha,
            monto_pagado: visita.monto_pagado,
            compro: visita.compro,
            entregado: formatearProductos(visita.ventas_productos, 'cantidad_entregada'),
            retirado: formatearProductos(visita.ventas_productos, 'cantidad_retirada'),
            productos: visita.ventas_productos ?? [],
        }));
    }

    getVisitasDeHoyByRepartidor = async (repartidorId) => {
        if (!repartidorId) {
            throw new Error('El ID del repartidor es obligatorio para buscar las visitas');
        }
        const returnData = await this.visitaRepo.getVisitasDeHoyByRepartidor(repartidorId);
        return returnData;
    }
}