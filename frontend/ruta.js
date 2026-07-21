const DIRECCION_FABRICA = 'Av. San Martín 4500, Buenos Aires';
const CAPACIDAD_CAMION = 40;
const MINUTOS_POR_CLIENTE = 12;
const MINUTOS_ENTRE_PARADAS = 8;
const MINUTOS_VUELTA_FABRICA = 25;
const CARGA_DEFAULT = 2;

// Penalización cuando dos direcciones no están en la misma calle
const PENALIZACION_CALLE_DISTINTA = 100000;

// Cache: clave "clienteId-dia" → carga estimada en envases
const cacheCargas = {};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];

// getDay(): 0=Domingo … 6=Sábado → nuestros nombres (Sábados = 6)
function nombreDiaDesdeFecha(fecha) {
  const d = new Date(fecha);
  const diaJs = d.getDay();
  if (diaJs === 0) return null;
  return DIAS_SEMANA[diaJs - 1];
}

function quitarTildes(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parsearDireccion(direccion) {
  const normalizada = quitarTildes(direccion || '');
  const matchAltura = normalizada.match(/\d+/);
  const altura = matchAltura ? Number(matchAltura[0]) : 0;
  const calle = normalizada.replace(/\d+/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return { calle: calle, altura: altura, raw: normalizada };
}

// Distancia aproximada sin GPS
function distanciaDirecciones(dirA, dirB) {
  const a = parsearDireccion(dirA);
  const b = parsearDireccion(dirB);

  if (a.calle && b.calle && a.calle === b.calle) {
    return Math.abs(a.altura - b.altura);
  }

  const maxLen = Math.max(a.calle.length, b.calle.length);
  let distStr = 0;
  for (let i = 0; i < maxLen; i++) {
    const ca = a.calle.charCodeAt(i) || 0;
    const cb = b.calle.charCodeAt(i) || 0;
    distStr += Math.abs(ca - cb);
  }

  return PENALIZACION_CALLE_DISTINTA + distStr + Math.abs(a.altura - b.altura);
}

function sumaEntregadaVisita(visita) {
  const productos = visita.productos || [];
  let total = 0;
  for (let i = 0; i < productos.length; i++) {
    total += Number(productos[i].cantidad_entregada) || 0;
  }
  return total;
}

function visitaTieneEntrega(visita) {
  if (visita.compro) return true;
  return sumaEntregadaVisita(visita) > 0;
}

function cargaDesdeStock(cliente) {
  const stock = cliente.stock || [];
  let total = 0;
  for (let i = 0; i < stock.length; i++) {
    let nombre = '';
    if (stock[i].productos && stock[i].productos.nombre) {
      nombre = stock[i].productos.nombre.toLowerCase();
    }
    // No contamos dispensers como carga de envases del camión
    if (nombre.indexOf('dispenser') !== -1) continue;
    total += Number(stock[i].cantidad) || 0;
  }
  return total;
}

// Última compra del mismo día de la semana
function estimarCargaDesdeVisitas(visitas, diaFiltro, cliente) {
  const candidatas = [];
  for (let i = 0; i < (visitas || []).length; i++) {
    const v = visitas[i];
    if (!visitaTieneEntrega(v)) continue;
    const diaVisita = nombreDiaDesdeFecha(v.fecha);
    if (diaVisita === diaFiltro) {
      candidatas.push(v);
    }
  }

  if (candidatas.length > 0) {
    candidatas.sort(function (a, b) {
      return new Date(b.fecha) - new Date(a.fecha);
    });
    const carga = sumaEntregadaVisita(candidatas[0]);
    if (carga > 0) return carga;
  }

  const desdeStock = cargaDesdeStock(cliente);
  if (desdeStock > 0) return desdeStock;
  return CARGA_DEFAULT;
}

async function obtenerCargaCliente(cliente, diaFiltro, getFn) {
  const clave = String(cliente.id) + '-' + diaFiltro;
  if (cacheCargas[clave] !== undefined) {
    return cacheCargas[clave];
  }

  let visitas = [];
  try {
    visitas = await getFn('/visita/cliente/' + cliente.id);
  } catch (err) {
    visitas = [];
  }
  if (!Array.isArray(visitas)) visitas = [];

  let carga = estimarCargaDesdeVisitas(visitas, diaFiltro, cliente);
  if (carga > CAPACIDAD_CAMION) carga = CAPACIDAD_CAMION;
  cacheCargas[clave] = carga;
  return carga;
}

async function adjuntarCargas(clientes, diaFiltro, getFn) {
  const resultado = [];
  for (let i = 0; i < clientes.length; i++) {
    const c = clientes[i];
    const carga = await obtenerCargaCliente(c, diaFiltro, getFn);
    resultado.push({
      cliente: c,
      carga: carga,
    });
  }
  return resultado;
}