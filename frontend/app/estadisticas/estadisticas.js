const API = location.port === "8080"
    ? "http://localhost:3000/api"
    : "https://aquaflash-nine.vercel.app/api";

const filtroPeriodo = document.getElementById('filtro-periodo');
const filtroRepartidor = document.getElementById('filtro-repartidor');
const mensajeEstado = document.getElementById('mensaje-estado');
const canvasGrafico = document.getElementById('grafico-ingresos');

let grafico = null;

const plata = (n) => `$${Number(n).toLocaleString('es-AR')}`;

function textoVariacion(valor, invertir = false) {
    if (valor === 0) {
        return { texto: '0% vs período anterior', clase: 'kpi-card__variacion--neutra', flecha: '' };
    }

    const positivo = valor > 0;
    const esBueno = invertir ? !positivo : positivo;
    const flecha = positivo ? '↑' : '↓';
    const signo = positivo ? '+' : '';
    const clase = esBueno ? 'kpi-card__variacion--positiva' : 'kpi-card__variacion--negativa';

    return {
        texto: `${flecha} ${signo}${valor}% vs período anterior`,
        clase,
        flecha,
    };
}

function aplicarVariacion(elemento, valor, invertir = false) {
    const { texto, clase } = textoVariacion(valor, invertir);
    elemento.textContent = texto;
    elemento.className = `kpi-card__variacion ${clase}`;
}

function pintarTarjetas(tarjetas, operativo) {
    document.getElementById('kpi-total-vendido').textContent = plata(tarjetas.total_vendido.valor);
    aplicarVariacion(document.getElementById('kpi-total-variacion'), tarjetas.total_vendido.variacion);

    document.getElementById('kpi-deuda').textContent = plata(tarjetas.deuda_acumulada.valor);
    aplicarVariacion(document.getElementById('kpi-deuda-variacion'), tarjetas.deuda_acumulada.variacion, true);

    document.getElementById('kpi-nuevos').textContent = tarjetas.nuevos_clientes.total;
    document.getElementById('kpi-nuevos-promo').textContent = `${tarjetas.nuevos_clientes.con_promo} por promo`;
    document.getElementById('kpi-nuevos-sin-promo').textContent = `${tarjetas.nuevos_clientes.sin_promo} sin promo`;

    document.getElementById('kpi-promos').textContent = tarjetas.promociones_activas;

    document.getElementById('kpi-visitas').textContent = operativo.visitas.total;
    document.getElementById('kpi-visitas-detalle').textContent =
        `${operativo.visitas.con_compra} con compra · ${operativo.visitas.sin_compra} sin compra`;
    aplicarVariacion(document.getElementById('kpi-visitas-variacion'), operativo.visitas.variacion);

    document.getElementById('kpi-ticket').textContent = plata(operativo.ticket_promedio.valor);
    aplicarVariacion(document.getElementById('kpi-ticket-variacion'), operativo.ticket_promedio.variacion);

    document.getElementById('kpi-cobro').textContent = `${operativo.tasa_cobro.valor}%`;
    const cobroVar = operativo.tasa_cobro.variacion;
    const cobroEl = document.getElementById('kpi-cobro-variacion');
    if (cobroVar === 0) {
        cobroEl.textContent = '0 pts vs período anterior';
        cobroEl.className = 'kpi-card__variacion kpi-card__variacion--neutra';
    } else {
        const signo = cobroVar > 0 ? '+' : '';
        cobroEl.textContent = `${cobroVar > 0 ? '↑' : '↓'} ${signo}${cobroVar} pts vs período anterior`;
        cobroEl.className = `kpi-card__variacion ${cobroVar > 0 ? 'kpi-card__variacion--positiva' : 'kpi-card__variacion--negativa'}`;
    }

    document.getElementById('kpi-unidades').textContent = operativo.unidades_entregadas.valor.toLocaleString('es-AR');
    aplicarVariacion(document.getElementById('kpi-unidades-variacion'), operativo.unidades_entregadas.variacion);
}

function pintarIndicadores(operativo) {
    document.getElementById('ind-cobrado').textContent = plata(operativo.cobrado_periodo);
    document.getElementById('ind-sin-compra').textContent = operativo.visitas.sin_compra;
    document.getElementById('ind-con-deuda').textContent = operativo.clientes_con_deuda;
    document.getElementById('ind-activos').textContent = operativo.clientes_activos;
}

function pintarRanking(repartidores) {
    const contenedor = document.getElementById('ranking-repartidores');
    const vacio = document.getElementById('ranking-vacio');
    const conVentas = repartidores.filter((r) => r.ventas > 0 || r.visitas > 0);

    if (conVentas.length === 0) {
        contenedor.replaceChildren();
        vacio.hidden = false;
        return;
    }

    vacio.hidden = true;
    const maxVentas = Math.max(...conVentas.map((r) => r.ventas), 1);

    contenedor.replaceChildren(...conVentas.map((rep, i) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        const pct = Math.round((rep.ventas / maxVentas) * 100);
        item.innerHTML = `
            <span class="ranking-item__pos ${i === 0 ? 'ranking-item__pos--top' : ''}">${i + 1}</span>
            <span class="ranking-item__nombre">${rep.nombre}</span>
            <div class="ranking-item__barra">
                <div class="ranking-item__barra-fill" style="width: ${pct}%"></div>
            </div>
            <div class="ranking-item__stats">
                <span class="ranking-item__ventas">${plata(rep.ventas)}</span>
                <span class="ranking-item__meta">${rep.visitas} visitas · ${rep.entregas} u.</span>
            </div>
        `;
        return item;
    }));
}

function pintarProductos(productos) {
    document.getElementById('prod-mas-nombre').textContent = productos.mas_vendido.nombre;
    document.getElementById('prod-mas-cantidad').textContent = productos.mas_vendido.cantidad;
    document.getElementById('prod-menos-nombre').textContent = productos.menos_vendido.nombre;
    document.getElementById('prod-menos-cantidad').textContent = productos.menos_vendido.cantidad;
}

function esTemaOscuro() {
    return window.aquaflashTema?.esTemaOscuro() ?? false;
}

function coloresGrafico() {
    const oscuro = esTemaOscuro();
    return {
        texto: oscuro ? '#d1d5db' : '#6b7280',
        grid: oscuro ? '#374151' : '#e5e7eb',
        ventas: '#3b82f6',
        entregas: '#22c55e',
    };
}

function pintarGrafico(datos) {
    const colores = coloresGrafico();

    if (grafico) {
        grafico.destroy();
    }

    grafico = new Chart(canvasGrafico, {
        type: 'bar',
        data: {
            labels: datos.dias,
            datasets: [
                {
                    label: 'Ventas ($)',
                    data: datos.ventas,
                    backgroundColor: colores.ventas,
                    borderRadius: 6,
                    yAxisID: 'y',
                    order: 2,
                },
                {
                    label: 'Entregas (u)',
                    data: datos.entregas,
                    backgroundColor: colores.entregas,
                    borderRadius: 6,
                    yAxisID: 'y1',
                    order: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colores.texto,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: 20,
                    },
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const valor = context.parsed.y;
                            if (context.dataset.label.includes('Ventas')) {
                                return `Ventas: ${plata(valor)}`;
                            }
                            return `Entregas: ${valor} u.`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colores.texto },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: colores.grid },
                    ticks: {
                        color: colores.ventas,
                        callback: (v) => `$${Number(v).toLocaleString('es-AR')}`,
                    },
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: colores.entregas,
                        callback: (v) => `${v} u.`,
                    },
                },
            },
        },
    });

    requestAnimationFrame(() => grafico?.resize());
}

async function get(ruta) {
    const res = await fetch(`${API}${ruta}`);
    if (!res.ok) throw new Error(`Error en ${ruta}`);
    return res.json();
}

async function cargarRepartidores() {
    const repartidores = await get('/repartidor');
    filtroRepartidor.replaceChildren(
        new Option('Todos los repartidores', ''),
        ...repartidores.map((r) => new Option(r.nombre, r.id))
    );
}

async function cargarEstadisticas() {
    mensajeEstado.hidden = false;
    mensajeEstado.textContent = 'Cargando estadísticas...';

    const periodo = filtroPeriodo.value;
    const repartidorId = filtroRepartidor.value;
    const query = new URLSearchParams({ periodo });
    if (repartidorId) query.set('repartidor_id', repartidorId);

    try {
        const data = await get(`/estadisticas/resumen?${query}`);
        pintarTarjetas(data.tarjetas, data.operativo);
        pintarIndicadores(data.operativo);
        pintarProductos(data.productos);
        pintarRanking(data.repartidores);
        pintarGrafico(data.grafico);
        mensajeEstado.hidden = true;
    } catch (error) {
        console.error(error);
        mensajeEstado.hidden = false;
        mensajeEstado.textContent = 'No se pudieron cargar las estadísticas. Verificá que el backend esté corriendo.';
    }
}

function actualizarColoresGrafico() {
    if (!grafico) return;
    const colores = coloresGrafico();
    grafico.options.plugins.legend.labels.color = colores.texto;
    grafico.options.scales.x.ticks.color = colores.texto;
    grafico.options.scales.y.ticks.color = colores.ventas;
    grafico.options.scales.y.grid.color = colores.grid;
    grafico.options.scales.y1.ticks.color = colores.entregas;
    grafico.update();
}

filtroPeriodo.addEventListener('change', cargarEstadisticas);
filtroRepartidor.addEventListener('change', cargarEstadisticas);

window.addEventListener('aquaflash-theme-change', actualizarColoresGrafico);
window.addEventListener('resize', () => grafico?.resize());

async function iniciar() {
    try {
        await cargarRepartidores();
        await cargarEstadisticas();
    } catch (error) {
        console.error(error);
        mensajeEstado.hidden = false;
        mensajeEstado.textContent = 'No se pudieron cargar las estadísticas. Verificá que el backend esté corriendo.';
    }
}

iniciar();
