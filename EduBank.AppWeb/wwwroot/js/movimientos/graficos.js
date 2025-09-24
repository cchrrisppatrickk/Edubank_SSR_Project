// wwwroot/js/movimientos/graficos.js
class GraficosMovimientos {
    constructor(manager) {
        this.manager = manager;
        this.chartGastos = null;
        this.chartIngresos = null;
        this.currentPeriodoRequest = null;

        // Mapeo de períodos frontend -> backend
        this.PERIOD_MAP = {
            day: 'dia',
            week: 'semana',
            month: 'mes',
            year: 'año'
        };
    }

    // Destruir gráficos existentes
    destruirCharts() {
        try {
            if (this.chartGastos) {
                this.chartGastos.destroy();
                this.chartGastos = null;
            }
        } catch (e) { }

        try {
            if (this.chartIngresos) {
                this.chartIngresos.destroy();
                this.chartIngresos = null;
            }
        } catch (e) { }
    }

    // Procesar datos de respuesta para gráficos
    splitDataFromResponse(res) {
        if (!res) return { gastos: {}, ingresos: {} };

        // Diferentes formatos de respuesta posibles
        if (Array.isArray(res.totalesPorCategoria) && res.totalesPorCategoria.length) {
            const g = {}, i = {};
            res.totalesPorCategoria.forEach(x => {
                const tipo = (x.tipo || '').toString();
                const nombre = x.categoriaNombre ?? x.nombre ?? 'Sin categoría';
                const total = Number(x.total || 0);

                if (MovimientosUtils.isGasto(tipo)) {
                    g[nombre] = (g[nombre] || 0) + total;
                } else if (MovimientosUtils.isIngreso(tipo)) {
                    i[nombre] = (i[nombre] || 0) + total;
                }
            });
            return { gastos: g, ingresos: i };
        }

        // Formato alternativo
        if (Array.isArray(res.totalesPorCategoriaGasto) || Array.isArray(res.totalesPorCategoriaIngreso)) {
            const g = {}, i = {};
            (res.totalesPorCategoriaGasto || []).forEach(x =>
                g[x.categoriaNombre ?? x.nombre ?? 'Sin categoría'] = Number(x.total || 0));
            (res.totalesPorCategoriaIngreso || []).forEach(x =>
                i[x.categoriaNombre ?? x.nombre ?? 'Sin categoría'] = Number(x.total || 0));
            return { gastos: g, ingresos: i };
        }

        // Fallback: procesar desde movimientos recientes
        const gastos = {}, ingresos = {};
        (res.recientes || []).forEach(r => {
            const nombre = r.categoriaNombre ?? r.categoria ?? 'Sin categoría';
            const total = Number(r.monto || 0);
            const tipo = r.tipo ?? '';

            if (MovimientosUtils.isGasto(tipo)) {
                gastos[nombre] = (gastos[nombre] || 0) + total;
            } else if (MovimientosUtils.isIngreso(tipo)) {
                ingresos[nombre] = (ingresos[nombre] || 0) + total;
            } else {
                gastos[nombre] = (gastos[nombre] || 0) + total;
            }
        });

        return { gastos, ingresos };
    }

    // Preparar dataset para gráficos
    buildDataset(obj) {
        const labels = Object.keys(obj);
        const data = labels.map(l => Number(obj[l] || 0));
        return { labels, data };
    }

    // Obtener color para etiqueta de gráfico
    getColorForLabel(label, index, fallbackPalette) {
        const key = (label || '').toString().trim().toLowerCase();
        let info = this.manager.categoriasByName[key];

        if (!info) {
            for (const id in this.manager.categoriasMap) {
                const n = (this.manager.categoriasMap[id].nombre || '').toString().trim().toLowerCase();
                if (n === key) {
                    info = this.manager.categoriasMap[id];
                    break;
                }
            }
        }

        let color = info?.color || info?.categoriaColor || null;
        color = MovimientosUtils.normalizeHex(color);
        if (!color) color = fallbackPalette[index % fallbackPalette.length];
        return color;
    }

    // Crear gráfico de doughnut
    crearChart(ctx, dataset, tipo) {
        const palette = MovimientosUtils.palette(dataset.data.length);
        const bgColors = dataset.labels.map((lab, idx) => {
            const c = this.getColorForLabel(lab, idx, palette);
            return MovimientosUtils.normalizeHex(c) || palette[idx % palette.length];
        });

        const chartOpts = {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return `${ctx.label}: ${MovimientosUtils.fmt(ctx.raw || 0)}`;
                        }
                    }
                }
            }
        };

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dataset.labels,
                datasets: [{
                    data: dataset.data,
                    backgroundColor: bgColors,
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: chartOpts
        });
    }

    // Actualizar gráficos con datos
    actualizarGraficos(datos) {
        this.destruirCharts();

        const split = this.splitDataFromResponse(datos);
        const dsGastos = this.buildDataset(split.gastos || {});
        const dsIngresos = this.buildDataset(split.ingresos || {});

        // Mostrar/ocultar mensajes de "sin datos"
        $('#noDataGastos').toggle(!dsGastos.data.length);
        $('#noDataIngresos').toggle(!dsIngresos.data.length);

        // Crear gráfico de gastos
        if (dsGastos.data.length) {
            const ctxG = document.getElementById('chartGastos').getContext('2d');
            this.chartGastos = this.crearChart(ctxG, dsGastos, 'gastos');
        } else {
            const ctxG = document.getElementById('chartGastos').getContext('2d');
            ctxG.clearRect(0, 0, ctxG.canvas.width, ctxG.canvas.height);
        }

        // Crear gráfico de ingresos
        if (dsIngresos.data.length) {
            const ctxI = document.getElementById('chartIngresos').getContext('2d');
            this.chartIngresos = this.crearChart(ctxI, dsIngresos, 'ingresos');
        } else {
            const ctxI = document.getElementById('chartIngresos').getContext('2d');
            ctxI.clearRect(0, 0, ctxI.canvas.width, ctxI.canvas.height);
        }

        // Forzar actualización
        setTimeout(() => {
            try {
                if (this.chartGastos) {
                    this.chartGastos.resize();
                    this.chartGastos.update();
                }
            } catch (e) { }

            try {
                if (this.chartIngresos) {
                    this.chartIngresos.resize();
                    this.chartIngresos.update();
                }
            } catch (e) { }
        }, 50);
    }

    // Formatear período para visualización
    formatearPeriodo(fecha, periodo) {
        const opciones = {
            day: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
            week: {}, // Manejo especial para semanas
            month: { month: 'long', year: 'numeric' },
            year: { year: 'numeric' }
        };

        switch (periodo) {
            case 'day':
                const hoy = new Date();
                const esHoy = fecha.getDate() === hoy.getDate() &&
                    fecha.getMonth() === hoy.getMonth() &&
                    fecha.getFullYear() === hoy.getFullYear();

                if (esHoy) {
                    return `Hoy, ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                } else {
                    return fecha.toLocaleDateString('es-ES', opciones.day);
                }

            case 'week':
                const inicioSemana = new Date(fecha);
                inicioSemana.setDate(fecha.getDate() - fecha.getDay() + (fecha.getDay() === 0 ? -6 : 1));
                const finSemana = new Date(inicioSemana);
                finSemana.setDate(inicioSemana.getDate() + 6);

                return `${inicioSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;

            case 'month':
                return fecha.toLocaleDateString('es-ES', opciones.month);

            case 'year':
                return fecha.toLocaleDateString('es-ES', opciones.year);

            default:
                return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }

    // Navegar entre fechas según período
    navegarFecha(direccion) {
        const paso = direccion === 'next' ? 1 : -1;

        switch (this.manager.currentPeriod) {
            case 'day':
                this.manager.currentDate.setDate(this.manager.currentDate.getDate() + paso);
                break;
            case 'week':
                this.manager.currentDate.setDate(this.manager.currentDate.getDate() + (paso * 7));
                break;
            case 'month':
                this.manager.currentDate.setMonth(this.manager.currentDate.getMonth() + paso);
                break;
            case 'year':
                this.manager.currentDate.setFullYear(this.manager.currentDate.getFullYear() + paso);
                break;
        }

        this.actualizarVisualizacionFecha();
        this.fetchPorPeriodoDebounced(this.manager.currentPeriod, this.manager.currentDate);
    }

    // Actualizar visualización de fecha
    actualizarVisualizacionFecha() {
        $('#dateDisplay').text(this.formatearPeriodo(this.manager.currentDate, this.manager.currentPeriod));
    }

    // Obtener datos por período
    async fetchPorPeriodo(periodoFrontend = this.manager.currentPeriod, fechaRef = this.manager.currentDate) {
        // Abortar petición anterior si existe
        try {
            if (this.currentPeriodoRequest && typeof this.currentPeriodoRequest.abort === 'function') {
                this.currentPeriodoRequest.abort();
            }
        } catch (e) { }

        const periodoBackend = this.PERIOD_MAP[periodoFrontend] || periodoFrontend;
        const fecha = MovimientosUtils.formatDateISO(fechaRef || new Date());
        const url = `/Movimiento/ObtenerPorPeriodo?periodo=${encodeURIComponent(periodoBackend)}&fecha=${encodeURIComponent(fecha)}`;

        let res = null;
        try {
            this.currentPeriodoRequest = $.ajax({
                url,
                method: 'GET',
                dataType: 'json'
            });
            res = await this.currentPeriodoRequest;
        } catch (err) {
            toastr.error('No se pudieron cargar los datos del período');
            this.limpiarVistas();
            return;
        } finally {
            this.currentPeriodoRequest = null;
        }

        this.procesarDatosPeriodo(res);
    }

    // Procesar datos del período
    procesarDatosPeriodo(res) {
        const movimientos = (res && res.movimientos) ? res.movimientos : [];

        // Agrupar por categoría
        const gastosByCat = {};
        const ingresosByCat = {};

        movimientos.forEach(m => {
            const cat = m.CategoriaNombre ?? m.categoriaNombre ??
                (this.manager.categoriasMap[Number(m.CategoriaId || m.categoriaId)]?.nombre) ?? 'Sin categoría';
            const monto = Number(m.Monto ?? m.monto ?? 0);
            const tipo = (m.Tipo ?? m.tipo ?? '').toString().toUpperCase();

            if (tipo.startsWith('G')) {
                gastosByCat[cat] = (gastosByCat[cat] || 0) + monto;
            } else {
                ingresosByCat[cat] = (ingresosByCat[cat] || 0) + monto;
            }
        });

        this.actualizarGraficosPeriodo(gastosByCat, ingresosByCat, movimientos);
    }

    // Actualizar gráficos del período
    actualizarGraficosPeriodo(gastosByCat, ingresosByCat, movimientos) {
        const dsGastos = this.buildDataset(gastosByCat);
        const dsIngresos = this.buildDataset(ingresosByCat);

        $('#noDataGastos').toggle(!dsGastos.data.length);
        $('#noDataIngresos').toggle(!dsIngresos.data.length);

        this.destruirCharts();
        this.crearGraficosPeriodo(dsGastos, dsIngresos);
        this.manager.listar.actualizarListas(movimientos);
    }

    // Crear gráficos del período
    crearGraficosPeriodo(dsGastos, dsIngresos) {
        const commonChartOpts = {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return `${ctx.label}: ${MovimientosUtils.fmt(ctx.raw || 0)}`;
                        }
                    }
                }
            }
        };

        // Gráfico de gastos
        if (dsGastos.data.length) {
            const ctxG = document.getElementById('chartGastos').getContext('2d');
            const palG = MovimientosUtils.palette(dsGastos.data.length);
            const bgG = dsGastos.labels.map((lab, idx) =>
                MovimientosUtils.normalizeHex(this.getColorForLabel(lab, idx, palG)) || palG[idx % palG.length]);

            this.chartGastos = new Chart(ctxG, {
                type: 'doughnut',
                data: {
                    labels: dsGastos.labels,
                    datasets: [{
                        data: dsGastos.data,
                        backgroundColor: bgG,
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: commonChartOpts
            });
        }

        // Gráfico de ingresos
        if (dsIngresos.data.length) {
            const ctxI = document.getElementById('chartIngresos').getContext('2d');
            const palI = MovimientosUtils.palette(dsIngresos.data.length);
            const bgI = dsIngresos.labels.map((lab, idx) =>
                MovimientosUtils.normalizeHex(this.getColorForLabel(lab, idx, palI)) || palI[idx % palI.length]);

            this.chartIngresos = new Chart(ctxI, {
                type: 'doughnut',
                data: {
                    labels: dsIngresos.labels,
                    datasets: [{
                        data: dsIngresos.data,
                        backgroundColor: bgI,
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: commonChartOpts
            });
        }
    }

    // Limpiar vistas en caso de error
    limpiarVistas() {
        $('#listaGastosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        $('#listaIngresosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        this.destruirCharts();
    }

    // Debounced version de fetchPorPeriodo
    fetchPorPeriodoDebounced = MovimientosUtils.debounce((periodo, fecha) => {
        this.fetchPorPeriodo(periodo, fecha);
    }, 160);
}