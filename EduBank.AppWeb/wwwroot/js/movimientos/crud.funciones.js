// wwwroot/js/movimientos/crud.funciones.js
class CRUDManager {
    constructor(manager) {
        this.manager = manager;
        this.currentEstRequest = null;
        this.currentPeriodoRequest = null;
        this.lastFocusedTrigger = null;
        this.init();
    }

    init() {
        this.configurarEventosCRUD();
        this.fetchPorPeriodoDebounced = MovimientosUtils.debounce(this.fetchPorPeriodo.bind(this), 160);
    }

    // ==================== FUNCIONES DE LECTURA ====================
    async cargarEstadisticas() {
        try {
            if (this.currentEstRequest && typeof this.currentEstRequest.abort === 'function') {
                this.currentEstRequest.abort();
            }
        } catch(e) {}

        let res = null;
        try {
            this.currentEstRequest = $.ajax({ url: '/Movimiento/Estadisticas', method: 'GET', dataType: 'json' });
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

    mostrarValoresPorDefecto() {
        $('#cardIngresos').text(MovimientosUtils.fmt(0));
        $('#cardGastos').text(MovimientosUtils.fmt(0));
        $('#cardSaldo').text(MovimientosUtils.fmt(0));
        $('#listaGastosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        $('#listaIngresosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        this.manager.graficos.destruirCharts();
    }

    actualizarEstadisticas(res) {
        $('#cardIngresos').text(MovimientosUtils.fmt(res.totalIngresos ?? res.TotalIngresos ?? 0));
        $('#cardGastos').text(MovimientosUtils.fmt(res.totalGastos ?? res.TotalGastos ?? 0));
        $('#cardSaldo').text(MovimientosUtils.fmt(res.saldo ?? res.Saldo ?? 
            ((res.totalIngresos ?? res.TotalIngresos ?? 0) - (res.totalGastos ?? res.TotalGastos ?? 0))));

        const split = this.splitDataFromResponse(res);
        const dsGastos = this.buildDataset(split.gastos || {});
        const dsIngresos = this.buildDataset(split.ingresos || {});

        $('#totalGastosLabel').text(MovimientosUtils.fmt(Object.values(split.gastos || {}).reduce((a,b) => a + b, 0)));
        $('#totalIngresosLabel').text(MovimientosUtils.fmt(Object.values(split.ingresos || {}).reduce((a,b) => a + b, 0)));

        this.manager.graficos.actualizarGraficos(dsGastos, dsIngresos);
        this.actualizarListasMovimientos(res.recientes || []);
    }

    splitDataFromResponse(res) {
        if (!res) return { gastos: {}, ingresos: {} };

        if (Array.isArray(res.totalesPorCategoria) && res.totalesPorCategoria.length) {
            const g = {}, i = {};
            res.totalesPorCategoria.forEach(x => {
                const tipo = (x.tipo || '').toString();
                const nombre = x.categoriaNombre ?? x.nombre ?? 'Sin categoría';
                const total = Number(x.total || 0);
                if (MovimientosUtils.isGasto(tipo)) g[nombre] = (g[nombre] || 0) + total;
                else if (MovimientosUtils.isIngreso(tipo)) i[nombre] = (i[nombre] || 0) + total;
            });
            if (Object.keys(g).length || Object.keys(i).length) return { gastos: g, ingresos: i };
        }

        const gastos = {}, ingresos = {};
        (res.recientes || []).forEach(r => {
            const nombre = r.categoriaNombre ?? r.categoria ?? 'Sin categoría';
            const total = Number(r.monto || 0);
            const tipo = r.tipo ?? '';
            if (MovimientosUtils.isGasto(tipo)) gastos[nombre] = (gastos[nombre] || 0) + total;
            else if (MovimientosUtils.isIngreso(tipo)) ingresos[nombre] = (ingresos[nombre] || 0) + total;
            else gastos[nombre] = (gastos[nombre] || 0) + total;
        });
        return { gastos, ingresos };
    }

    buildDataset(obj) {
        const labels = Object.keys(obj);
        const data = labels.map(l => Number(obj[l] || 0));
        return { labels, data };
    }

    // ==================== FUNCIONES DE FILTRADO POR PERIODO ====================
    async fetchPorPeriodo(periodoFrontend = this.manager.graficos.currentPeriod, fechaRef = this.manager.graficos.currentDate) {
        const periodoBackend = MovimientosUtils.PERIOD_MAP[periodoFrontend] || periodoFrontend;
        const fecha = MovimientosUtils.formatDateISO(fechaRef || new Date());

        try { 
            if (this.currentPeriodoRequest && typeof this.currentPeriodoRequest.abort === 'function') {
                this.currentPeriodoRequest.abort(); 
            }
        } catch(e){}

        const url = `/Movimiento/ObtenerPorPeriodo?periodo=${encodeURIComponent(periodoBackend)}&fecha=${encodeURIComponent(fecha)}`;

        let res = null;
        try {
            this.currentPeriodoRequest = $.ajax({ url, method: 'GET', dataType: 'json' });
            res = await this.currentPeriodoRequest;
        } catch (err) {
            toastr.error('No se pudieron cargar los datos del período');
            this.limpiarVistasPeriodo();
            return;
        } finally {
            this.currentPeriodoRequest = null;
        }

        this.procesarDatosPeriodo(res.movimientos || []);
    }

    procesarDatosPeriodo(movimientos) {
        const gastosByCat = {};
        const ingresosByCat = {};

        movimientos.forEach(m => {
            const cat = m.CategoriaNombre ?? m.categoriaNombre ?? 
                       (this.manager.categoriasMap[Number(m.CategoriaId || m.categoriaId)]?.nombre) ?? 'Sin categoría';
            const monto = Number(m.Monto ?? m.monto ?? 0);
            const tipo = (m.Tipo ?? m.tipo ?? '').toString().toUpperCase();

            if (tipo.startsWith('G')) gastosByCat[cat] = (gastosByCat[cat] || 0) + monto;
            else ingresosByCat[cat] = (ingresosByCat[cat] || 0) + monto;
        });

        const dsGastos = this.buildDataset(gastosByCat);
        const dsIngresos = this.buildDataset(ingresosByCat);

        this.manager.graficos.actualizarGraficos(dsGastos, dsIngresos);
        this.actualizarListasPeriodo(movimientos);
    }

    limpiarVistasPeriodo() {
        $('#listaGastosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        $('#listaIngresosChart').empty().append($('<li>').addClass('list-group-item text-muted small').text('No hay datos'));
        this.manager.graficos.destruirCharts();
    }

    // ==================== FUNCIONES DE ACTUALIZACIÓN DE LISTAS ====================
    actualizarListasMovimientos(recientes) {
        const gastosRecientes = recientes.filter(r => MovimientosUtils.isGasto(r.tipo)).slice(0, 6);
        const ingresosRecientes = recientes.filter(r => MovimientosUtils.isIngreso(r.tipo)).slice(0, 6);

        this.actualizarLista('#listaGastosChart', gastosRecientes, 'No hay movimientos recientes de gasto');
        this.actualizarLista('#listaIngresosChart', ingresosRecientes, 'No hay movimientos recientes de ingreso');
    }

    actualizarListasPeriodo(movimientos) {
        const gastosRec = movimientos.filter(x => MovimientosUtils.isGasto(x.Tipo ?? x.tipo)).slice(0, 8);
        const ingresosRec = movimientos.filter(x => MovimientosUtils.isIngreso(x.Tipo ?? x.tipo)).slice(0, 8);

        this.actualizarLista('#listaGastosChart', gastosRec, 'No hay movimientos recientes de gasto');
        this.actualizarLista('#listaIngresosChart', ingresosRec, 'No hay movimientos recientes de ingreso');
    }

    actualizarLista(selector, movimientos, mensajeVacio) {
        const $lista = $(selector).empty();
        if (!movimientos.length) {
            $lista.append($('<li>').addClass('list-group-item text-muted small').text(mensajeVacio));
        } else {
            movimientos.forEach(r => $lista.append(this.crearItemLista(r)));
        }
    }

    crearItemLista(r) {
        const fecha = r.fechaOperacion || r.fecha || '';
        const nombre = r.categoriaNombre ?? r.categoria ?? (this.manager.categoriasMap[Number(r.categoriaId)]?.nombre ?? '');
        const montoFmt = MovimientosUtils.fmt(Number(r.monto || 0));
        const tipo = r.tipo ?? '';

        const catFromId = this.manager.categoriasMap[Number(r.categoriaId)];
        const catFromName = this.manager.categoriasByName[(r.categoriaNombre ?? r.categoria ?? '').toString().trim().toLowerCase()];
        const catInfo = catFromId || catFromName || {};

        const icono = r.categoriaIcono ?? r.icono ?? catInfo.icono ?? '';
        const color = r.categoriaColor ?? r.color ?? catInfo.color ?? '#6c757d';

        const $li = $('<li>').addClass('list-group-item d-flex justify-content-between align-items-center py-2');
        const $left = $('<div>').addClass('small cat-cell');
        const $badge = $('<div>').addClass('cat-icon-badge')
            .css('background-color', MovimientosUtils.normalizeHex(color) || '#6c757d')
            .css('color', MovimientosUtils.textColorForBg(MovimientosUtils.normalizeHex(color) || '#6c757d'));

        if (MovimientosUtils.isValidIconClass(icono)) {
            $badge.append($('<i>').addClass(icono));
        } else {
            $badge.text((nombre || '').substring(0, 1).toUpperCase());
        }

        $left.append($badge);
        const $meta = $('<div>');
        $meta.append($('<div>').addClass('fw-semibold').text(nombre));
        $meta.append($('<div>').addClass('text-muted small').text(fecha));
        $left.append($meta);

        const $right = $('<div>').addClass('text-end');
        $right.append($('<div>').addClass('fw-bold').text(montoFmt));
        
        // Contenedor para botones de acciones
        const $btnWrap = $('<div>').addClass('mt-1 d-flex gap-1');
        const $btnEditar = $('<button>').addClass('btn btn-sm btn-outline-primary btn-editar')
            .attr('title', 'Editar').attr('data-id', r.movimientoId)
            .html('<i class="bi bi-pencil"></i>');
        const $btnEliminar = $('<button>').addClass('btn btn-sm btn-danger btn-eliminar')
            .attr('title', 'Eliminar').attr('data-id', r.movimientoId)
            .html('<i class="bi bi-trash"></i>');

        $btnWrap.append($btnEditar, $btnEliminar);
        $right.append($btnWrap);
        $li.append($left).append($right);
        
        return $li;
    }

    // ==================== FUNCIONES CRUD PRINCIPALES ====================
    configurarEventosCRUD() {
        // Evento para botones de tipo de movimiento
        $('.btn-mov-type').on('click', (e) => {
            this.lastFocusedTrigger = e.target;
            this.mostrarFormularioNuevo($(e.target).data('type'));
        });

        // Evento para enviar formulario
        $('#formMovimiento').submit((e) => this.guardarMovimiento(e));

        // Eventos para eliminar movimientos
        $('#listaGastosChart, #listaIngresosChart').on('click', '.btn-eliminar', (e) => {
            this.eliminarMovimiento($(e.target).closest('.btn-eliminar'));
        });

        // Eventos para editar movimientos
        $('#listaGastosChart, #listaIngresosChart').on('click', '.btn-editar', (e) => {
            this.editarMovimiento($(e.target).closest('.btn-editar'));
        });

        // Evento para abrir modal de categorías
        $('#btnCategoriaSelected').on('click', (e) => {
            e.preventDefault();
            this.mostrarModalCategorias();
        });

        // Restaurar foco al cerrar modal
        $('#movModal').on('hidden.bs.modal', () => {
            $('#selTipo').val('G');
            $('#movModalTypeBadge').empty();
            if (this.lastFocusedTrigger) {
                try { 
                    this.lastFocusedTrigger.focus(); 
                } catch(e) {}
            }
        });
    }

    // ==================== FUNCIÓN: MOSTRAR FORMULARIO NUEVO ====================
    mostrarFormularioNuevo(tipo) {
        const isI = (tipo === 'I');

        // Reiniciar formulario completamente para creación
        $('#txtMovimientoId').val(0);
        $('#formMovimiento')[0].reset();
        $('#selCategoria').val(0);

        // Ocultar mensaje informativo de edición
        $('#edicionInfo').hide();

        // Restablecer visualización de categoría
        $('#btnCategoriaBadge').css('background-color', '#e9ecef')
            .css('color', '#6c757d')
            .empty()
            .append($('<i>').addClass('bi bi-palette'));
        $('#btnCategoriaLabel').text('Categoría');

        // Establecer fecha actual
        $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

        // Configurar tipo y categorías
        $('#selTipo').val(tipo);
        this.populateCategoriaSelect(tipo);

        // Actualizar badge visual
        const $badge = $('<span>').addClass('mov-type-badge ' + (isI ? 'income' : 'expense'))
            .text(isI ? 'Ingreso' : 'Gasto');
        $('#movModalTypeBadge').empty().append($badge);

        // Actualizar título del modal
        $('#movModalLabel').contents().filter(function(){
            return this.nodeType === 3;
        }).first().replaceWith(isI ? 'Agregar ingreso ' : 'Agregar gasto ');

        // Mostrar advertencia si no hay categorías
        if ($('#selCategoria').prop('disabled')) {
            toastr.warning('No hay categorías disponibles para este tipo. Crea una categoría primero.');
        }

        const modalEl = document.getElementById('movModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bsModal.show();

        // Enfocar campo de monto
        setTimeout(() => $('#txtMonto').focus(), 250);
    }

    // ==================== FUNCIÓN: GUARDAR MOVIMIENTO ====================
    async guardarMovimiento(e) {
        e.preventDefault();
        const $btn = $(e.target).find('button[type="submit"]');
        if (!$btn.data('original-html')) {
            $btn.data('original-html', $btn.html());
        }
        $btn.prop('disabled', true);
        $btn.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');

        try {
            // Preparar datos del formulario
            const movimientoId = Number($('#txtMovimientoId').val() || 0);
            const categoriaSeleccionada = Number($('#selCategoria').val() || 0);
            const esEdicion = movimientoId > 0;

            const modelo = {
                MovimientoId: movimientoId,
                CategoriaId: categoriaSeleccionada,
                Tipo: $('#selTipo').val(),
                FechaOperacion: $('#txtFechaOperacion').val(),
                Monto: Number($('#txtMonto').val() || 0),
                Comentario: $('#txtComentario').val()
            };

            // Validaciones básicas
            if (!this.validarMovimiento(modelo, esEdicion, categoriaSeleccionada)) {
                $btn.prop('disabled', false).html($btn.data('original-html'));
                return;
            }

            // Manejo especial para edición: mantener categoría original si no se cambió
            if (esEdicion && (!categoriaSeleccionada || categoriaSeleccionada === 0)) {
                const movimientoOriginal = await $.get(`/Movimiento/ObtenerJson?id=${movimientoId}`);
                if (movimientoOriginal && movimientoOriginal.categoriaId) {
                    modelo.CategoriaId = movimientoOriginal.categoriaId;
                } else {
                    toastr.warning('No se pudo obtener la categoría original del movimiento');
                    $btn.prop('disabled', false).html($btn.data('original-html'));
                    return;
                }
            }

            // Validación de tipo de categoría (solo si se seleccionó una nueva categoría)
            if (categoriaSeleccionada && categoriaSeleccionada !== 0) {
                const catInfo = this.manager.categoriasMap[categoriaSeleccionada];
                if (!catInfo) {
                    toastr.warning('Categoría inválida');
                    $btn.prop('disabled', false).html($btn.data('original-html'));
                    return;
                }

                // Verificar que el tipo de categoría coincida con el tipo de movimiento
                const tipoCategoria = MovimientosUtils.normalizeTipo(catInfo.tipo);
                const tipoMovimiento = MovimientosUtils.normalizeTipo(modelo.Tipo);

                if (tipoCategoria !== tipoMovimiento) {
                    toastr.warning('La categoría seleccionada no corresponde al tipo de movimiento.');
                    $btn.prop('disabled', false).html($btn.data('original-html'));
                    return;
                }
            }

            // Enviar datos al servidor
            const resultado = await this.enviarMovimientoAlServidor(modelo, esEdicion);
            if (resultado.exito) {
                this.limpiarFormularioSiEsNuevo(!esEdicion);
                this.cerrarModal();
                await this.actualizarVistas();
            }

        } catch (error) {
            console.error('Error en guardado:', error);
            toastr.error('Error al guardar: ' + (error.responseText || 'Error desconocido'));
        } finally {
            $btn.prop('disabled', false);
            $btn.html($btn.data('original-html'));
        }
    }

    validarMovimiento(modelo, esEdicion, categoriaSeleccionada) {
        if (!(modelo.Monto > 0)) {
            toastr.warning('Ingrese un monto válido mayor a 0');
            return false;
        }

        if (!esEdicion && (!categoriaSeleccionada || categoriaSeleccionada === 0)) {
            toastr.warning('Seleccione una categoría');
            return false;
        }

        return true;
    }

    async enviarMovimientoAlServidor(modelo, esEdicion) {
        const url = esEdicion ? '/Movimiento/Actualizar' : '/Movimiento/Insertar';
        const method = esEdicion ? 'PUT' : 'POST';

        const res = await $.ajax({
            url: url,
            type: method,
            contentType: 'application/json',
            data: JSON.stringify(modelo)
        });

        if (res && res.valor) {
            toastr.success(esEdicion ? 'Movimiento actualizado' : 'Movimiento guardado');
            return { exito: true };
        } else {
            const msg = (res && (res.mensaje || res.message)) || 'No se pudo guardar';
            toastr.error(msg);
            return { exito: false };
        }
    }

    limpiarFormularioSiEsNuevo(esNuevo) {
        if (esNuevo) {
            $('#formMovimiento')[0].reset();
            $('#txtMovimientoId').val(0);
            $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

            // Resetear visualización de categoría
            $('#btnCategoriaBadge').css('background-color', '#e9ecef')
                .css('color', '#6c757d')
                .empty()
                .append($('<i>').addClass('bi bi-palette'));
            $('#btnCategoriaLabel').text('Categoría');
        }
    }

    cerrarModal() {
        const modalEl = document.getElementById('movModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }

    async actualizarVistas() {
        await this.cargarEstadisticas();
        await this.fetchPorPeriodo(this.manager.graficos.currentPeriod, this.manager.graficos.currentDate);
    }

    // ==================== FUNCIÓN: ELIMINAR MOVIMIENTO ====================
    async eliminarMovimiento($boton) {
        if (!confirm('¿Eliminar movimiento?')) return;
        
        const id = $boton.data('id');
        $boton.prop('disabled', true);
        
        try {
            const res = await $.ajax({ 
                url: `/Movimiento/Eliminar?id=${id}`, 
                type: 'DELETE' 
            });
            
            if (res && res.valor) {
                toastr.success('Movimiento eliminado');
                await this.actualizarVistas();
            } else {
                const msg = (res && (res.mensaje || res.message)) || 'No se pudo eliminar';
                toastr.error(msg);
            }
        } catch (error) {
            toastr.error('Error al eliminar el movimiento');
            console.error('Error al eliminar:', error);
        } finally {
            $boton.prop('disabled', false);
        }
    }

    // ==================== FUNCIÓN: EDITAR MOVIMIENTO ====================
    async editarMovimiento($boton) {
        const movimientoId = $boton.data('id');
        await this.cargarMovimientoParaEditar(movimientoId);
    }

    async cargarMovimientoParaEditar(movimientoId) {
        try {
            const res = await $.get(`/Movimiento/ObtenerJson?id=${movimientoId}`);
            if (res && res.movimientoId) {
                // Llenar el formulario con los datos del movimiento
                $('#txtMovimientoId').val(res.movimientoId);
                $('#selTipo').val(res.tipo || 'G');
                $('#selCategoria').val(res.categoriaId || 0);
                $('#txtFechaOperacion').val(MovimientosUtils.formatDateISO(new Date(res.fechaOperacion)));
                $('#txtMonto').val(Number(res.monto || 0).toFixed(2));
                $('#txtComentario').val(res.comentario || '');

                // Actualizar la visualización de la categoría seleccionada
                this.actualizarVisualizacionCategoria(res.categoriaId);

                // Actualizar badge visual del tipo
                const isI = (res.tipo === 'I');
                const $badgeType = $('<span>').addClass('mov-type-badge ' + (isI ? 'income' : 'expense'))
                    .text(isI ? 'Ingreso' : 'Gasto');
                $('#movModalTypeBadge').empty().append($badgeType);

                // Actualizar título del modal
                $('#movModalLabel').contents().filter(function() {
                    return this.nodeType === 3;
                }).first().replaceWith(isI ? 'Editar ingreso ' : 'Editar gasto ');

                // Mostrar mensaje informativo para edición
                this.mostrarMensajeEdicion();

                // Mostrar el modal
                const modalEl = document.getElementById('movModal');
                const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                bsModal.show();

                // Enfocar campo de monto
                setTimeout(() => $('#txtMonto').focus(), 250);
            } else {
                toastr.error('No se pudieron cargar los datos del movimiento');
            }
        } catch (error) {
            toastr.error('Error al cargar el movimiento para editar');
            console.error('Error al cargar movimiento:', error);
        }
    }

    actualizarVisualizacionCategoria(categoriaId) {
        const catInfo = this.manager.categoriasMap[Number(categoriaId)];
        if (catInfo) {
            const color = MovimientosUtils.normalizeHex(catInfo.color) || '#6c757d';
            const $badge = $('#btnCategoriaBadge');
            const $label = $('#btnCategoriaLabel');

            $badge.css('background-color', color);
            $badge.css('color', MovimientosUtils.textColorForBg(color));
            $badge.empty();
            
            if (MovimientosUtils.isValidIconClass(catInfo.icono)) {
                $badge.append($('<i>').addClass(catInfo.icono));
            } else {
                $badge.text((catInfo.nombre || '').substring(0, 1).toUpperCase());
            }
            $label.text(catInfo.nombre);
        } else {
            // Si no se encuentra la categoría, mostrar un mensaje
            $('#btnCategoriaLabel').text('Categoría no encontrada');
            $('#btnCategoriaBadge').css('background-color', '#dc3545').css('color', 'white')
                .empty().append($('<i>').addClass('bi bi-exclamation-triangle'));
        }
    }

    mostrarMensajeEdicion() {
        if (!$('#edicionInfo').length) {
            const $info = $('<div id="edicionInfo" class="alert alert-info alert-dismissible fade show small mt-2 mb-0"></div>');
            $info.html('<i class="bi bi-info-circle me-1"></i>La categoría actual se mantendrá si no selecciona una nueva. <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>');
            $('#formMovimiento .modal-body').prepend($info);
        } else {
            $('#edicionInfo').show();
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================
    populateCategoriaSelect(tipo) {
        const $sel = $('#selCategoria').empty();
        const entries = Object.entries(this.manager.categoriasMap || {});
        const filtered = entries.filter(([id, info]) => {
            if (!tipo) return true;
            const t = MovimientosUtils.normalizeTipo(info.tipo || info.Tipo);
            return t === tipo;
        });

        if (!filtered.length) {
            $sel.append($('<option>').attr('value', 0).text('No hay categorías disponibles'));
            $sel.prop('disabled', true);
            $('#btnGuardarModal').prop('disabled', true);

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

    mostrarModalCategorias() {
        const modalEl = document.getElementById('modalCategorias');
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        const tipo = $('#selTipo').val() || 'G';
        this.renderCategoriaGrid(tipo);
        this.lastFocusedTrigger = document.getElementById('btnCategoriaSelected');
        bsModal.show();
    }

    renderCategoriaGrid(tipo) {
        const $grid = $('#gridCategorias').empty();
        const entries = Object.entries(this.manager.categoriasMap || {});
        const filtered = entries.filter(([id, info]) => {
            if (!tipo) return true;
            const t = MovimientosUtils.normalizeTipo(info.tipo || info.Tipo);
            return t === tipo;
        });

        if (!filtered.length) {
            $grid.append($('<div>').addClass('col-12 text-center text-muted small').text('No hay categorías para mostrar'));
            return;
        }

        // Ordenar y mostrar categorías
        filtered.sort((a, b) => (a[1].nombre || '').localeCompare(b[1].nombre || ''));
        filtered.forEach(([id, info]) => {
            const color = MovimientosUtils.normalizeHex(info.color) || '#6c757d';
            const $col = $('<div>').addClass('col');
            const $card = $('<div>').addClass('categoria-card')
                .attr('tabindex', 0)
                .attr('role', 'button')
                .attr('aria-pressed', 'false')
                .css('background', '#fff')
                .on('click keypress', (e) => {
                    if (e.type === 'click' || (e.type === 'keypress' && (e.key === 'Enter' || e.key === ' '))) {
                        this.selectCategoria(Number(id));
                    }
                });

            const $badge = $('<div>').addClass('cat-icon-badge')
                .css('margin', '0 auto')
                .css('background-color', color)
                .css('color', MovimientosUtils.textColorForBg(color));
            
            if (MovimientosUtils.isValidIconClass(info.icono)) {
                $badge.append($('<i>').addClass(info.icono));
            } else {
                $badge.text((info.nombre || '').substring(0, 1).toUpperCase());
            }

            $card.append($badge);
            $card.append($('<div>').addClass('categoria-label').text(info.nombre));
            $col.append($card);
            $grid.append($col);
        });
    }

    selectCategoria(id) {
        const item = this.manager.categoriasMap[id];
        if (!item) return;
        
        $('#selCategoria').val(id);

        const color = MovimientosUtils.normalizeHex(item.color) || '#6c757d';
        const $badge = $('#btnCategoriaBadge');
        const $label = $('#btnCategoriaLabel');

        // Actualizar badge visual
        $badge.css('background-color', color);
        $badge.css('color', MovimientosUtils.textColorForBg(color));
        $badge.empty();
        
        if (MovimientosUtils.isValidIconClass(item.icono)) {
            $badge.append($('<i>').addClass(item.icono));
        } else {
            $badge.text((item.nombre || '').substring(0, 1).toUpperCase());
        }

        $label.text(item.nombre);

        // Cerrar modal
        const modalEl = document.getElementById('modalCategorias');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }
}