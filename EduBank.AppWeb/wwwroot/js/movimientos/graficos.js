// wwwroot/js/movimientos/graficos.js
class GraficosManager {
    constructor(manager) {
        this.manager = manager;
        this.chartGastos = null;
        this.chartIngresos = null;
        this.currentDate = new Date();
        this.currentPeriod = 'day';
        this.calendarDate = new Date(this.currentDate);
        this.init();
    }

    init() {
        this.configurarCalendario();
        this.configurarEventosGraficos();
    }

    // ==================== FUNCIONES DE CALENDARIO ====================
    configurarCalendario() {
        this.actualizarVisualizacionFecha();
        this.generarCalendario(this.calendarDate);
    }

    formatearPeriodo(fecha, periodo) {
        const opcionesMes = { month: 'long' };
        const opcionesDia = { day: 'numeric' };
        const opcionesAnio = { year: 'numeric' };

        switch(periodo) {
            case 'day':
                const hoy = new Date();
                const esHoy = fecha.getDate() === hoy.getDate() &&
                             fecha.getMonth() === hoy.getMonth() &&
                             fecha.getFullYear() === hoy.getFullYear();

                if (esHoy) {
                    return `Hoy, ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                } else {
                    return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                }
            case 'week':
                const inicioSemana = new Date(fecha);
                inicioSemana.setDate(fecha.getDate() - fecha.getDay() + (fecha.getDay() === 0 ? -6 : 1));
                const finSemana = new Date(inicioSemana);
                finSemana.setDate(inicioSemana.getDate() + 6);
                return `${inicioSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            case 'month':
                return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            case 'year':
                return fecha.toLocaleDateString('es-ES', { year: 'numeric' });
            default:
                return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    }

    actualizarVisualizacionFecha() {
        $('#dateDisplay').text(this.formatearPeriodo(this.currentDate, this.currentPeriod));
    }

    navegarFecha(direccion) {
        const paso = direccion === 'next' ? 1 : -1;

        switch(this.currentPeriod) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + paso);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (paso * 7));
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + paso);
                break;
            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + paso);
                break;
        }

        this.actualizarVisualizacionFecha();
        this.manager.crud.fetchPorPeriodoDebounced(this.currentPeriod, this.currentDate);
    }

    generarCalendario(fecha) {
        const year = fecha.getFullYear();
        const month = fecha.getMonth();

        $('#calendarMonthYear').text(fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0).getDate();

        const firstDayIndex = firstDay.getDay();
        const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        const lastDayIndex = lastDay.getDay();
        const adjustedLastDayIndex = lastDayIndex === 0 ? 6 : lastDayIndex - 1;

        let calendarDays = '';

        // Días del mes anterior
        for (let i = adjustedFirstDayIndex; i > 0; i--) {
            calendarDays += `<div class="calendar-day other-month">${prevLastDay - i + 1}</div>`;
        }

        // Días del mes actual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const isToday = i === this.currentDate.getDate() && month === this.currentDate.getMonth() && year === this.currentDate.getFullYear();
            calendarDays += `<div class="calendar-day ${isToday ? 'selected' : ''}" data-day="${i}">${i}</div>`;
        }

        // Días del próximo mes
        const daysNextMonth = 7 - adjustedLastDayIndex - 1;
        for (let i = 1; i <= daysNextMonth; i++) {
            calendarDays += `<div class="calendar-day other-month">${i}</div>`;
        }

        $('#calendarDays').html(calendarDays);

        $('.calendar-day:not(.other-month)').off('click.selectDay').on('click.selectDay', (e) => {
            const day = $(e.target).data('day');
            this.currentDate = new Date(year, month, day);
            this.calendarDate = new Date(this.currentDate);
            this.actualizarVisualizacionFecha();
            $('#calendarPopup').removeClass('show');
            this.manager.crud.fetchPorPeriodoDebounced(this.currentPeriod, this.currentDate);
        });
    }

    // ==================== FUNCIONES DE GRÁFICOS ====================
    configurarEventosGraficos() {
        // Evento para cambiar entre pestañas (actualiza gráficos)
        $('#movimientosTabs').on('shown.bs.tab', (e) => {
            const targetId = e.target?.id || '';
            if (targetId === 'gastos-tab' && this.chartGastos) {
                try {
                    this.chartGastos.resize();
                    this.chartGastos.update();
                } catch (err) {}
            }
            if (targetId === 'ingresos-tab' && this.chartIngresos) {
                try {
                    this.chartIngresos.resize();
                    this.chartIngresos.update();
                } catch (err) {}
            }
        });

        // Eventos de calendario
        $('#prevDate').on('click', () => this.navegarFecha('prev'));
        $('#nextDate').on('click', () => this.navegarFecha('next'));
        $('#prevMonth').on('click', (e) => {
            e.stopPropagation();
            this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
            this.generarCalendario(this.calendarDate);
        });
        $('#nextMonth').on('click', (e) => {
            e.stopPropagation();
            this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
            this.generarCalendario(this.calendarDate);
        });

        // Evento para mostrar/ocultar calendario
        $('#dateDisplay').on('click', (e) => {
            $('#calendarPopup').toggleClass('show');
            e.stopPropagation();
        });

        // Cerrar calendario al hacer clic fuera
        $(document).on('click', (e) => {
            if (!$(e.target).closest('.calendar-container').length) {
                $('#calendarPopup').removeClass('show');
            }
        });

        // Eventos para cambiar período
        $('.filter-btn-group .btn').on('click', (e) => {
            $('.filter-btn-group .btn').removeClass('active').addClass('btn-outline-primary');
            $('.filter-btn-group .btn').removeClass('btn-primary');
            $(e.target).addClass('active').addClass('btn-primary').removeClass('btn-outline-primary');
            
            this.currentPeriod = $(e.target).data('period');
            this.actualizarVisualizacionFecha();
            this.manager.crud.fetchPorPeriodoDebounced(this.currentPeriod, this.currentDate);
        });
    }

    destruirCharts() {
        if (this.chartGastos) {
            try { this.chartGastos.destroy(); } catch(e){}
            this.chartGastos = null;
        }
        if (this.chartIngresos) {
            try { this.chartIngresos.destroy(); } catch(e){}
            this.chartIngresos = null;
        }
    }

    crearGrafico(ctx, datos, tipo = 'doughnut') {
        const commonChartOpts = {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${MovimientosUtils.fmt(ctx.raw || 0)}`
                    }
                }
            }
        };

        const palette = MovimientosUtils.palette(datos.labels.length);
        const bgColors = datos.labels.map((lab, idx) => {
            const c = MovimientosUtils.getColorForLabel(lab, idx, palette, this.manager.categoriasByName, this.manager.categoriasMap);
            return MovimientosUtils.normalizeHex(c) || palette[idx % palette.length];
        });

        return new Chart(ctx, {
            type: tipo,
            data: {
                labels: datos.labels,
                datasets: [{
                    data: datos.data,
                    backgroundColor: bgColors,
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: commonChartOpts
        });
    }

    actualizarGraficos(datosGastos, datosIngresos) {
        this.destruirCharts();

        // Mostrar/ocultar mensajes de "sin datos"
        $('#noDataGastos').toggle(!datosGastos.data.length);
        $('#noDataIngresos').toggle(!datosIngresos.data.length);

        // Gráfico de gastos
        if (datosGastos.data.length) {
            const ctxG = document.getElementById('chartGastos').getContext('2d');
            this.chartGastos = this.crearGrafico(ctxG, datosGastos);
        }

        // Gráfico de ingresos
        if (datosIngresos.data.length) {
            const ctxI = document.getElementById('chartIngresos').getContext('2d');
            this.chartIngresos = this.crearGrafico(ctxI, datosIngresos);
        }

        // Forzar actualización
        setTimeout(() => {
            try { 
                if (this.chartGastos) { 
                    this.chartGastos.resize(); 
                    this.chartGastos.update(); 
                } 
            } catch(e){}
            try { 
                if (this.chartIngresos) { 
                    this.chartIngresos.resize(); 
                    this.chartIngresos.update(); 
                } 
            } catch(e){}
        }, 50);
    }
}