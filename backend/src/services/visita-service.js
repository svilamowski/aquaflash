import VisitaRepository from '../repositories/visita-repository.js';
import StockRepository from '../repositories/stock-repository.js';
import ProductoRepository from '../repositories/producto-repository.js';
import ClienteRepository from '../repositories/cliente-repository.js';
import { sincronizarNotificaciones } from './notificacion-reglas-service.js';

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
        this.clienteRepo = new ClienteRepository();
    }

    actualizarStockCliente = async (clienteId, ventasArray) => {
        for (const venta of ventasArray) {
            if (venta.cantidad_entregada > 0) {
                await this.clienteRepo.asignarProductoCliente(
                    clienteId,
                    venta.producto_id,
                    venta.cantidad_entregada
                );
            }
            if (venta.cantidad_retirada > 0) {
                await this.clienteRepo.quitarProductoCliente(
                    clienteId,
                    venta.producto_id,
                    venta.cantidad_retirada
                );
            }
        }
    };

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

        if (productos?.length) {
            for (const item of productos) {
                const retirada = item.cantidad_retirada ?? 0;
                if (retirada <= 0) continue;

                let productoId = item.producto_id;
                if (!productoId) {
                    const nombre = item.productos?.nombre ?? item.nombre;
                    const producto = await this.productoRepo.getProductoByNombre(nombre);
                    productoId = producto?.id;
                }

                const enCasa = await this.clienteRepo.getCantidadProductoCliente(
                    cabecera.cliente_id,
                    productoId
                );
                if (retirada > enCasa) {
                    throw new Error('No se pueden retirar más vacíos de los que el cliente tiene en casa');
                }
            }
        }

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
            await this.actualizarStockCliente(cabecera.cliente_id, ventasArray);
        }

        const huboEntrega = productos?.some((p) => (p.cantidad_entregada ?? 0) > 0);
        const actualizacionCliente = { id: cabecera.cliente_id };

        if (huboEntrega || cabecera.compro) {
            actualizacionCliente.ultima_compra = fechaValida.toISOString().split('T')[0];
        }
        if ((cabecera.monto_pagado ?? 0) > 0) {
            actualizacionCliente.ultimo_pago = fechaValida.toISOString().split('T')[0];
        }
        if (actualizacionCliente.ultima_compra || actualizacionCliente.ultimo_pago) {
            await this.clienteRepo.alterCliente(actualizacionCliente);
        }

        const historial = await this.visitaRepo.getVisitasByCliente(visita.cliente_id);
        const visitaCreada = historial.find((v) => v.id === visita.id);

        await sincronizarNotificaciones();

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
            monto_total_venta: visita.monto_total_venta,
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