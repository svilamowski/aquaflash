// ============================================
// Ruta sugerida: se usa cuando hay filtro de DÍA + REPARTIDOR.
// Ordena clientes por proximidad, los parte en viajes por capacidad
// del camión y estima el tiempo total del reparto.
// ============================================

// Dirección de partida de todos los viajes
const DIRECCION_FABRICA = 'Av. San Martín 4500, Buenos Aires';
// Máximo de envases por viaje
const CAPACIDAD_CAMION = 40;
// Minutos de atención en cada domicilio
const MINUTOS_POR_CLIENTE = 12;
// Minutos de traslado entre paradas (aprox. fija, sin GPS)
const MINUTOS_ENTRE_PARADAS = 8;
// Minutos de reposición en fábrica entre un viaje y el siguiente
const MINUTOS_VUELTA_FABRICA = 25;
// Carga que asumimos si no hay historial ni stock
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
  // Los domingos no se usan en el sistema
  if (diaJs === 0) return null;
  return DIAS_SEMANA[diaJs - 1];
}

// Pasa a minúsculas y saca tildes para comparar calles
function quitarTildes(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Separa la dirección en calle (texto) y altura (primer número)
function parsearDireccion(direccion) {
  const normalizada = quitarTildes(direccion || '');
  const matchAltura = normalizada.match(/\d+/);
  const altura = matchAltura ? Number(matchAltura[0]) : 0;
  const calle = normalizada.replace(/\d+/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return { calle: calle, altura: altura, raw: normalizada };
}

// Distancia aproximada sin GPS
// Misma calle → diferencia de alturas; calles distintas → penalización + diff de nombre
function distanciaDirecciones(dirA, dirB) {
  const a = parsearDireccion(dirA);
  const b = parsearDireccion(dirB);

  if (a.calle && b.calle && a.calle === b.calle) {
    return Math.abs(a.altura - b.altura);
  }

  // Compara letra a letra los nombres de calle
  const maxLen = Math.max(a.calle.length, b.calle.length);
  let distStr = 0;
  for (let i = 0; i < maxLen; i++) {
    const ca = a.calle.charCodeAt(i) || 0;
    const cb = b.calle.charCodeAt(i) || 0;
    distStr += Math.abs(ca - cb);
  }

  return PENALIZACION_CALLE_DISTINTA + distStr + Math.abs(a.altura - b.altura);
}

// Suma las cantidades entregadas en una visita
function sumaEntregadaVisita(visita) {
  const productos = visita.productos || [];
  let total = 0;
  for (let i = 0; i < productos.length; i++) {
    total += Number(productos[i].cantidad_entregada) || 0;
  }
  return total;
}

// Indica si la visita cuenta como compra/entrega
function visitaTieneEntrega(visita) {
  if (visita.compro) return true;
  return sumaEntregadaVisita(visita) > 0;
}

// Fallback: suma stock en casa (sin dispensers)
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
// Orden: 1) visita de ese día  2) stock en casa  3) CARGA_DEFAULT
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
    // Más reciente primero
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

// Pide historial al API (o usa cache) y devuelve la carga estimada
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
  // Un cliente no puede superar la capacidad del camión
  if (carga > CAPACIDAD_CAMION) carga = CAPACIDAD_CAMION;
  cacheCargas[clave] = carga;
  return carga;
}

// Arma la lista { cliente, carga } para todos los visibles
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

// Parte la ruta ordenada en viajes según capacidad del camión
function armarViajes(itemsConCarga) {
  const viajes = [];
  let viajeActual = [];
  let cargaViaje = 0;

  for (let i = 0; i < itemsConCarga.length; i++) {
    const item = itemsConCarga[i];
    // Si el próximo no entra, cerramos el viaje (vuelve a fábrica) y empezamos otro
    if (cargaViaje + item.carga > CAPACIDAD_CAMION && viajeActual.length > 0) {
      viajes.push({
        clientes: viajeActual.slice(),
        cargaUsada: cargaViaje,
        capacidadLibre: CAPACIDAD_CAMION - cargaViaje,
      });
      viajeActual = [];
      cargaViaje = 0;
    }
    viajeActual.push(item);
    cargaViaje += item.carga;
  }

  // Último viaje
  if (viajeActual.length > 0) {
    viajes.push({
      clientes: viajeActual.slice(),
      cargaUsada: cargaViaje,
      capacidadLibre: CAPACIDAD_CAMION - cargaViaje,
    });
  }

  return viajes;
}

/*
 * Tiempo estimado:
 * - Por cada viaje con n clientes:
 *   n+1 tramos de traslado (fábrica→primero, entre clientes, último→fábrica)
 *   + n * atención en domicilio
 * - Entre viajes (reposición en fábrica): MINUTOS_VUELTA_FABRICA
 */
function estimarMinutosTotales(viajes) {
    let minutos = 0;
    for (let i = 0; i < viajes.length; i++) {
      const n = viajes[i].clientes.length;
      if (n > 0) {
        minutos += (n + 1) * MINUTOS_ENTRE_PARADAS;
        minutos += n * MINUTOS_POR_CLIENTE;
      }
      // Reposición solo si hay otro viaje después
      if (i < viajes.length - 1) {
        minutos += MINUTOS_VUELTA_FABRICA;
      }
    }
    return minutos;
}
  
  // Pasa minutos a texto: "3 h 20 min", "45 min", "2 h"
  function formatearDuracion(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h <= 0) return m + ' min';
    if (m === 0) return h + ' h';
    return h + ' h ' + m + ' min';
}

// Solo se activa con día de la semana + repartidor elegidos
function modoRutaActivo(filtroTipo, filtroDia, repartidorValue) {
  return filtroTipo === 'dia' && !!filtroDia && !!repartidorValue;
}

// Ordena por proximidad respetando el objeto { cliente, carga }
// Nearest-neighbor: arranca en la fábrica y siempre elige el más cercano pendiente
function ordenarItemsPorProximidad(items) {
  const pendientes = items.slice();
  const ordenados = [];
  let puntoActual = DIRECCION_FABRICA;

  while (pendientes.length > 0) {
    let mejorIdx = 0;
    let mejorDist = distanciaDirecciones(puntoActual, pendientes[0].cliente.direccion);
    for (let i = 1; i < pendientes.length; i++) {
      const dist = distanciaDirecciones(puntoActual, pendientes[i].cliente.direccion);
      if (dist < mejorDist) {
        mejorDist = dist;
        mejorIdx = i;
      }
    }
    // Sacamos al elegido y el próximo salto parte desde su dirección
    const elegido = pendientes.splice(mejorIdx, 1)[0];
    ordenados.push(elegido);
    puntoActual = elegido.cliente.direccion;
  }

  return ordenados;
}

// Lo que index.js usa a través de window.RutaSugerida
window.RutaSugerida = {
  DIRECCION_FABRICA: DIRECCION_FABRICA,
  CAPACIDAD_CAMION: CAPACIDAD_CAMION,
  modoRutaActivo: modoRutaActivo,
  adjuntarCargas: adjuntarCargas,
  ordenarItemsPorProximidad: ordenarItemsPorProximidad,
  armarViajes: armarViajes,
  estimarMinutosTotales: estimarMinutosTotales,
  formatearDuracion: formatearDuracion,
};
