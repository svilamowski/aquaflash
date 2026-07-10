import EstadisticasRepository from '../repositories/estadisticas-repository.js';

const DIAS_GRAFICO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const INDICES_DIAS = [1, 2, 3, 4, 5, 6];

function toIsoInicio(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).toISOString();
}

function toIsoFin(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999).toISOString();
}

function calcularRangos(periodo) {
    const hoy = new Date();

    if (periodo === 'mes_anterior') {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        const duracion = fin.getDate();
        const inicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
        const finAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 0);
        return {
            inicio: toIsoInicio(inicio),
            fin: toIsoFin(fin),
            inicioAnterior: toIsoInicio(inicioAnterior),
            finAnterior: toIsoFin(finAnterior),
            duracion,
        };
    }

    if (periodo === 'semana') {
        const fin = new Date(hoy);
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        const finAnterior = new Date(inicio);
        finAnterior.setDate(inicio.getDate() - 1);
        const inicioAnterior = new Date(finAnterior);
        inicioAnterior.setDate(finAnterior.getDate() - 6);
        return {
            inicio: toIsoInicio(inicio),
            fin: toIsoFin(fin),
            inicioAnterior: toIsoInicio(inicioAnterior),
            finAnterior: toIsoFin(finAnterior),
            duracion: 7,
        };
    }

    if (periodo === 'trimestre') {
        const mesInicio = Math.floor(hoy.getMonth() / 3) * 3;
        const inicio = new Date(hoy.getFullYear(), mesInicio, 1);
        const fin = new Date(hoy.getFullYear(), mesInicio + 3, 0);
        const inicioAnterior = new Date(hoy.getFullYear(), mesInicio - 3, 1);
        const finAnterior = new Date(hoy.getFullYear(), mesInicio, 0);
        return {
            inicio: toIsoInicio(inicio),
            fin: toIsoFin(fin),
            inicioAnterior: toIsoInicio(inicioAnterior),
            finAnterior: toIsoFin(finAnterior),
            duracion: fin.getDate(),
        };
    }

    if (periodo === 'anio') {
        const inicio = new Date(hoy.getFullYear(), 0, 1);
        const fin = new Date(hoy.getFullYear(), 11, 31);
        const inicioAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
        const finAnterior = new Date(hoy.getFullYear() - 1, 11, 31);
        return {
            inicio: toIsoInicio(inicio),
            fin: toIsoFin(fin),
            inicioAnterior: toIsoInicio(inicioAnterior),
            finAnterior: toIsoFin(finAnterior),
            duracion: 365,
        };
    }

    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const inicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    return {
        inicio: toIsoInicio(inicio),
        fin: toIsoFin(fin),
        inicioAnterior: toIsoInicio(inicioAnterior),
        finAnterior: toIsoFin(finAnterior),
        duracion: fin.getDate(),
    };
}

function variacion(actual, anterior) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100);
}

function sumarTotalVendido(visitas) {
    return visitas
        .filter((v) => v.compro)
        .reduce((acc, v) => acc + Number(v.monto_total_venta || 0), 0);
}

function sumarDeudaPendienteVisitas(visitas) {
    return visitas
        .filter((v) => v.compro)
        .reduce((acc, v) => {
            const pendiente = Number(v.monto_total_venta || 0) - Number(v.monto_pagado || 0);
            return acc + Math.max(0, pendiente);
        }, 0);
}

function agruparPorDiaSemana(visitas) {
    const ventas = [0, 0, 0, 0, 0, 0, 0];
    const entregas = [0, 0, 0, 0, 0, 0, 0];

    for (const visita of visitas) {
        const dia = new Date(visita.fecha).getDay();
        if (visita.compro) {
            ventas[dia] += Number(visita.monto_total_venta || 0);
        }
        for (const vp of visita.ventas_productos || []) {
            entregas[dia] += Number(vp.cantidad_entregada || 0);
        }
    }

    return {
        dias: DIAS_GRAFICO,
        ventas: INDICES_DIAS.map((i) => ventas[i]),
        entregas: INDICES_DIAS.map((i) => entregas[i]),
    };
}

function sumarUnidadesEntregadas(visitas) {
    let total = 0;
    for (const visita of visitas) {
        for (const vp of visita.ventas_productos || []) {
            total += Number(vp.cantidad_entregada || 0);
        }
    }
    return total;
}

function sumarCobrado(visitas) {
    return visitas
        .filter((v) => v.compro)
        .reduce((acc, v) => acc + Number(v.monto_pagado || 0), 0);
}

function calcularOperativo(visitas, visitasAnterior, estadoClientes) {
    const conCompra = visitas.filter((v) => v.compro);
    const sinCompra = visitas.length - conCompra.length;
    const totalVendido = sumarTotalVendido(visitas);
    const cobrado = sumarCobrado(visitas);
    const unidades = sumarUnidadesEntregadas(visitas);
    const unidadesAnterior = sumarUnidadesEntregadas(visitasAnterior);
    const ticketPromedio = conCompra.length > 0 ? Math.round(totalVendido / conCompra.length) : 0;
    const ticketAnterior = visitasAnterior.filter((v) => v.compro);
    const ticketPromAnterior = ticketAnterior.length > 0
        ? Math.round(sumarTotalVendido(visitasAnterior) / ticketAnterior.length)
        : 0;
    const tasaCobro = totalVendido > 0 ? Math.round((cobrado / totalVendido) * 100) : 0;
    const totalVendidoAnterior = sumarTotalVendido(visitasAnterior);
    const cobradoAnterior = sumarCobrado(visitasAnterior);
    const tasaCobroAnterior = totalVendidoAnterior > 0
        ? Math.round((cobradoAnterior / totalVendidoAnterior) * 100)
        : 0;

    return {
        visitas: {
            total: visitas.length,
            con_compra: conCompra.length,
            sin_compra: sinCompra,
            variacion: variacion(visitas.length, visitasAnterior.length),
        },
        ticket_promedio: {
            valor: ticketPromedio,
            variacion: variacion(ticketPromedio, ticketPromAnterior),
        },
        tasa_cobro: {
            valor: tasaCobro,
            variacion: tasaCobro - tasaCobroAnterior,
        },
        unidades_entregadas: {
            valor: unidades,
            variacion: variacion(unidades, unidadesAnterior),
        },
        cobrado_periodo: cobrado,
        clientes_activos: estadoClientes.filter((c) => c.activo).length,
        clientes_con_deuda: estadoClientes.filter((c) => Number(c.deuda) > 0).length,
    };
}

function calcularRankingRepartidores(visitas, repartidores) {
    const mapa = {};

    for (const rep of repartidores) {
        mapa[rep.id] = {
            nombre: rep.nombre,
            ventas: 0,
            entregas: 0,
            visitas: 0,
        };
    }

    for (const visita of visitas) {
        const id = visita.repartidor_id;
        if (!mapa[id]) {
            mapa[id] = { nombre: `Repartidor ${id}`, ventas: 0, entregas: 0, visitas: 0 };
        }
        mapa[id].visitas += 1;
        if (visita.compro) {
            mapa[id].ventas += Number(visita.monto_total_venta || 0);
        }
        for (const vp of visita.ventas_productos || []) {
            mapa[id].entregas += Number(vp.cantidad_entregada || 0);
        }
    }

    return Object.values(mapa).sort((a, b) => b.ventas - a.ventas);
}

function calcularMetricasProducto(visitas) {
    const totales = {};

    for (const visita of visitas) {
        if (!visita.compro) continue;
        for (const vp of visita.ventas_productos || []) {
            const nombre = vp.productos?.nombre || `Producto ${vp.producto_id}`;
            totales[nombre] = (totales[nombre] || 0) + Number(vp.cantidad_entregada || 0);
        }
    }

    const entries = Object.entries(totales);
    if (entries.length === 0) {
        return {
            mas_vendido: { nombre: '—', cantidad: 0 },
            menos_vendido: { nombre: '—', cantidad: 0 },
        };
    }

    entries.sort((a, b) => b[1] - a[1]);
    const [masNombre, masCantidad] = entries[0];
    const [menosNombre, menosCantidad] = entries[entries.length - 1];

    return {
        mas_vendido: { nombre: masNombre, cantidad: masCantidad },
        menos_vendido: { nombre: menosNombre, cantidad: menosCantidad },
    };
}

export default class EstadisticasService {
    constructor() {
        this.estadisticasRepo = new EstadisticasRepository();
    }

    getVentasFiltradas = async (fechaInicio, fechaFin, repartidorId = null) => {
        if (!fechaInicio || !fechaFin) {
            throw new Error('Las fechas de inicio y fin son obligatorias para filtrar las ventas');
        }
        return this.estadisticasRepo.getVentasFiltradas(fechaInicio, fechaFin, repartidorId);
    };

    getClientesNuevosFiltrados = async (fechaInicio, fechaFin, repartidorId = null) => {
        if (!fechaInicio || !fechaFin) {
            throw new Error('Las fechas de inicio y fin son obligatorias para filtrar clientes nuevos');
        }
        return this.estadisticasRepo.getClientesNuevosFiltrados(fechaInicio, fechaFin, repartidorId);
    };

    getEstadoDeudasYPromos = async (repartidorId = null) => {
        return this.estadisticasRepo.getEstadoDeudasYPromos(repartidorId);
    };

    getResumen = async (periodo = 'mes', repartidorId = null) => {
        const rangos = calcularRangos(periodo);
        const repartidor = repartidorId ? Number(repartidorId) : null;

        const [visitas, visitasAnterior, clientesNuevos, estadoClientes, repartidores] = await Promise.all([
            this.estadisticasRepo.getVentasFiltradas(rangos.inicio, rangos.fin, repartidor),
            this.estadisticasRepo.getVentasFiltradas(rangos.inicioAnterior, rangos.finAnterior, repartidor),
            this.estadisticasRepo.getClientesNuevosFiltrados(rangos.inicio, rangos.fin, repartidor),
            this.estadisticasRepo.getEstadoDeudasYPromos(repartidor),
            this.estadisticasRepo.getRepartidores(),
        ]);

        const totalVendido = sumarTotalVendido(visitas);
        const totalVendidoAnterior = sumarTotalVendido(visitasAnterior);
        const deudaAcumulada = estadoClientes.reduce((acc, c) => acc + Number(c.deuda || 0), 0);
        const deudaPendienteActual = sumarDeudaPendienteVisitas(visitas);
        const deudaPendienteAnterior = sumarDeudaPendienteVisitas(visitasAnterior);
        const conPromo = clientesNuevos.filter((c) => c.es_promocion).length;
        const sinPromo = clientesNuevos.length - conPromo;
        const promocionesActivas = estadoClientes.filter((c) => c.es_promocion).length;

        return {
            periodo,
            tarjetas: {
                total_vendido: {
                    valor: totalVendido,
                    variacion: variacion(totalVendido, totalVendidoAnterior),
                },
                deuda_acumulada: {
                    valor: deudaAcumulada,
                    variacion: variacion(deudaPendienteActual, deudaPendienteAnterior),
                },
                nuevos_clientes: {
                    total: clientesNuevos.length,
                    con_promo: conPromo,
                    sin_promo: sinPromo,
                },
                promociones_activas: promocionesActivas,
            },
            operativo: calcularOperativo(visitas, visitasAnterior, estadoClientes),
            grafico: agruparPorDiaSemana(visitas),
            productos: calcularMetricasProducto(visitas),
            repartidores: calcularRankingRepartidores(visitas, repartidores),
        };
    };
}
