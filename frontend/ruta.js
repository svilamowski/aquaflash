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