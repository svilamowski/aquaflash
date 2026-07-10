import NotificacionRepository from '../repositories/notificacion-repository.js';
import ClienteRepository from '../repositories/cliente-repository.js';
import StockRepository from '../repositories/stock-repository.js';
import ProductoRepository from '../repositories/producto-repository.js';

const DEUDA_LIMITE = 200_000;
const DIAS_ALERTA_45 = 45;
const DIAS_ALERTA_90 = 90;
const DIAS_PROMO_RETIRO = 7;

const plata = (monto) => `$${Number(monto).toLocaleString('es-AR')}`;

const diasDesde = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    return Math.floor((hoy - inicio) / 86400000);
};

const diasSinCompra = (ultimaCompra) => diasDesde(ultimaCompra);

const tieneProductosEnCasa = (stock) =>
    stock?.some((item) => item.cantidad > 0) ?? false;

const nombreProductoPromo = (stock) => {
    const item = stock?.find((s) => s.cantidad > 0);
    return item?.productos?.nombre ?? 'bidón de prueba';
};

export default class NotificacionReglasService {
    constructor() {
        this.notifRepo = new NotificacionRepository();
        this.clienteRepo = new ClienteRepository();
        this.stockRepo = new StockRepository();
        this.productoRepo = new ProductoRepository();
    }

    evaluarReglas = async () => {
        const pendientes = [];

        const [fabrica, productos, clientes, clavesExistentes] = await Promise.all([
            this.stockRepo.getStockFabrica(),
            this.productoRepo.getAllProductos(),
            this.clienteRepo.getAllClientes(),
            this.notifRepo.getClavesExistentes(),
        ]);

        const productosPorId = Object.fromEntries(productos.map((p) => [p.id, p]));

        for (const item of fabrica) {
            const producto = productosPorId[item.producto_id];
            if (!producto) continue;

            const enFabrica = item.cantidad ?? 0;
            const minimo = producto.cantidad_minima_fabrica ?? 0;

            if (enFabrica < minimo) {
                pendientes.push({
                    clave: `stock-minimo-${producto.id}`,
                    mensaje: `El stock en fábrica de "${producto.nombre}" está por debajo del mínimo (${enFabrica}/${minimo}).`,
                });
            }
        }

        for (const cliente of clientes.filter((c) => c.activo)) {
            if (!cliente.es_promocion) {
                const dias = diasSinCompra(cliente.ultima_compra);

                if (dias !== null && dias >= DIAS_ALERTA_90) {
                    const stock = await this.clienteRepo.getStockEnCasa(cliente.id);
                    if (tieneProductosEnCasa(stock)) {
                        pendientes.push({
                            clave: `cliente-${cliente.id}-inactividad-90`,
                            mensaje: `${cliente.nombre} no compra hace ${dias} días y tiene productos en casa`,
                        });
                    }
                } else if (dias !== null && dias >= DIAS_ALERTA_45) {
                    pendientes.push({
                        clave: `cliente-${cliente.id}-inactividad-45`,
                        mensaje: `${cliente.nombre} no compra hace ${dias} días`,
                    });
                }

                if (Number(cliente.deuda) > DEUDA_LIMITE) {
                    pendientes.push({
                        clave: `cliente-${cliente.id}-deuda`,
                        mensaje: `${cliente.nombre} debe más de $200.000 (${plata(cliente.deuda)})`,
                    });
                }
            }

            if (cliente.es_promocion && cliente.fecha_inicio_promo) {
                const diasPromo = diasDesde(cliente.fecha_inicio_promo);
                if (diasPromo !== null && diasPromo >= DIAS_PROMO_RETIRO) {
                    const stock = await this.clienteRepo.getStockEnCasa(cliente.id);
                    pendientes.push({
                        clave: `cliente-${cliente.id}-promo-retiro`,
                        mensaje: `Hay que retirar promoción de ${cliente.nombre} (${nombreProductoPromo(stock)}) - Día 7 alcanzado`,
                    });
                }
            }
        }

        const claves = new Set(clavesExistentes);
        const mensajesExistentes = claves.size
            ? null
            : new Set((await this.notifRepo.getAllNotificaciones()).map((n) => n.mensaje));

        for (const notif of pendientes) {
            if (claves.has(notif.clave)) continue;
            if (mensajesExistentes?.has(notif.mensaje)) continue;

            await this.notifRepo.createNotificacion({
                mensaje: notif.mensaje,
                clave: notif.clave,
                leido: false,
            });
            claves.add(notif.clave);
            mensajesExistentes?.add(notif.mensaje);
        }
    };
}

let reglasService = null;

const obtenerReglasService = () => {
    if (!reglasService) reglasService = new NotificacionReglasService();
    return reglasService;
};

export const sincronizarNotificaciones = async () => {
    await obtenerReglasService().evaluarReglas();
};
