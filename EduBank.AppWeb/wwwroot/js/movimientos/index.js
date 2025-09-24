// wwwroot/js/movimientos/index.js
class MovimientosManager {
    constructor() {
        // Estado global
        this.categoriasMap = {};
        this.categoriasByName = {};
        this.currentDate = new Date();
        this.currentPeriod = 'day';
        this.lastFocusedTrigger = null;
        this.currentEstRequest = null;

        // Inicializar módulos
        this.utils = MovimientosUtils;
        this.listar = new ListarMovimientos(this);
        this.agregar = new AgregarMovimientos(this);
        this.editar = new EditarMovimientos(this);
        this.eliminar = new EliminarMovimientos(this);
        this.graficos = new GraficosMovimientos(this);
        this.modales = new ModalesMovimientos(this);

        this.init();
    }

    // Inicialización principal
    async init() {
        this.configurarToastr();
        this.configurarEventos();
        await this.cargarCategorias();
        await this.cargarEstadisticas();
        await this.graficos.fetchPorPeriodo(this.currentPeriod, this.currentDate);
    }

    // Configurar toastr
    configurarToastr() {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "preventDuplicates": true,
            "timeOut": "3500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    }

    // Configurar eventos globales
    configurarEventos() {
        // Eventos de botones de tipo de movimiento
        $('.btn-mov-type').on('click', (e) => {
            const tipo = $(e.currentTarget).data('type');
            this.agregar.mostrarFormNuevo(tipo);
        });

        // Evento para formulario de movimiento
        $('#formMovimiento').submit((e) => this.editar.manejarEnvioFormulario(e));

        // Eventos de calendario y períodos
        this.configurarEventosCalendario();

        // Configurar eventos de modales
        this.modales.inicializar();

        // Configurar eventos de eliminación
        this.eliminar.configurarEventListeners();

        // Eventos para edición desde listas
        $(document).on('click', '.btn-editar', async (e) => {
            const movimientoId = $(e.currentTarget).data('id');
            await this.editar.cargarMovimientoParaEditar(movimientoId);
        });
    }

    // Configurar eventos de calendario
    configurarEventosCalendario() {
        // Inicializar campo de fecha
        $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

        // Eventos para cambiar período
        $('.filter-btn-group .btn').on('click', (e) => {
            $('.filter-btn-group .btn').removeClass('active btn-primary').addClass('btn-outline-primary');
            $(e.currentTarget).addClass('active btn-primary').removeClass('btn-outline-primary');

            this.currentPeriod = $(e.currentTarget).data('period');
            this.graficos.actualizarVisualizacionFecha();
            this.graficos.fetchPorPeriodoDebounced(this.currentPeriod, this.currentDate);
        });

        // Eventos de navegación de fechas
        $('#prevDate').on('click', () => this.graficos.navegarFecha('prev'));
        $('#nextDate').on('click', () => this.graficos.navegarFecha('next'));
    }

    // Cargar categorías desde servidor
    async cargarCategorias() {
        try {
            const res = await $.get('/Categoria/Lista');
            this.categoriasMap = {};
            this.categoriasByName = {};

            (res || []).forEach(c => {
                const id = Number(c.categoriaId);
                const nombre = (c.nombre || '').toString();
                const item = {
                    nombre: nombre,
                    icono: c.icono || '',
                    color: c.color || '',
                    tipo: (c.tipo ?? c.Tipo ?? '').toString()
                };

                this.categoriasMap[id] = item;
                if (nombre) this.categoriasByName[nombre.trim().toLowerCase()] = item;
            });
        } catch (err) {
            $('#selCategoria').empty().append($('<option>').attr('value', 0).text('Sin categorías'));
            this.categoriasMap = {};
            this.categoriasByName = {};
            toastr.warning('No se pudieron cargar las categorías');
        }
    }

    // Poblar selector de categorías
    populateCategoriaSelect(tipo) {
        const $sel = $('#selCategoria').empty();
        const entries = Object.entries(this.categoriasMap || {});

        const filtered = entries.filter(([id, info]) => {
            if (!tipo) return true;
            const t = MovimientosUtils.normalizeTipo(info.tipo || info.Tipo);
            return t === tipo;
        });

        if (!filtered.length) {
            $sel.append($('<option>').attr('value', 0).text('No hay categorías disponibles'));
            $sel.prop('disabled', true);
            $('#btnGuardarModal').prop('disabled', true);
            this.mostrarMensajeNoCategorias();
            return;
        }

        // Ordenar categorías por nombre
        filtered.sort((a, b) => (a[1].nombre || '').localeCompare(b[1].nombre || ''));

        // Añadir opciones al selector
        filtered.forEach(([id, info]) => {
            $sel.append($('<option>').attr('value', id).text(info.nombre));
        });

        $sel.prop('disabled', false);
        $('#btnGuardarModal').prop('disabled', false);
        $('#noCatMensaje').remove();
    }

    // Mostrar mensaje cuando no hay categorías
    mostrarMensajeNoCategorias() {
        if (!$('#noCatMensaje').length) {
            const $msg = $('<div id="noCatMensaje" class="mt-2 text-warning small">No hay categorías para este tipo. <a href="#" id="crearCategoriaDesdeMov">Crear categoría</a></div>');
            $('#formMovimiento .modal-body').append($msg);

            $('#crearCategoriaDesdeMov').on('click', (e) => {
                e.preventDefault();
                if ($('#modalEdicion').length) {
                    $('#modalEdicion').modal('show');
                } else {
                    window.open('/Categoria', '_blank');
                }
            });
        }
    }

    // Cargar estadísticas generales
    async cargarEstadisticas() {
        try {
            if (this.currentEstRequest && typeof this.currentEstRequest.abort === 'function') {
                this.currentEstRequest.abort();
            }
        } catch (e) { }

        let res = null;
        try {
            this.currentEstRequest = $.ajax({
                url: '/Movimiento/Estadisticas',
                method: 'GET',
                dataType: 'json'
            });
            res = await this.currentEstRequest;
        } catch (err) {
            this.mostrarValoresPorDefecto();
            toastr.error('No se pudieron cargar las estadísticas');
            return;
        } finally {
            this.currentEstRequest = null;
        }

        this.actualizarEstadisticas(res);
    }

    // Mostrar valores por defecto en caso de error
    mostrarValoresPorDefecto() {
        $('#cardIngresos').text(MovimientosUtils.fmt(0));
        $('#cardGastos').text(MovimientosUtils.fmt(0));
        $('#cardSaldo').text(MovimientosUtils.fmt(0));

        $('#listaGastosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        $('#listaIngresosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));

        this.graficos.destruirCharts();
    }

    // Actualizar estadísticas con datos del servidor
    actualizarEstadisticas(res) {
        // Actualizar tarjetas de resumen
        $('#cardIngresos').text(MovimientosUtils.fmt(res.totalIngresos ?? res.TotalIngresos ?? 0));
        $('#cardGastos').text(MovimientosUtils.fmt(res.totalGastos ?? res.TotalGastos ?? 0));
        $('#cardSaldo').text(MovimientosUtils.fmt(res.saldo ?? res.Saldo ??
            ((res.totalIngresos ?? res.TotalIngresos ?? 0) - (res.totalGastos ?? res.TotalGastos ?? 0))));

        // Actualizar gráficos
        this.graficos.actualizarGraficos(res);

        // Actualizar listas de movimientos recientes
        const movimientosRecientes = res.recientes || [];
        this.listar.actualizarListas(movimientosRecientes);
    }

    // Recargar todos los datos
    async recargarDatos() {
        await this.cargarEstadisticas();
        await this.graficos.fetchPorPeriodo(this.currentPeriod, this.currentDate);
    }
}

// Inicialización cuando el DOM esté listo
$(document).ready(() => {
    window.movimientosApp = new MovimientosManager();
});