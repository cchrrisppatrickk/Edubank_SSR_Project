// wwwroot/js/movimientos/crudFunctions.js
class CRUDMovimientos {
    constructor(manager) {
        this.manager = manager;
        this.configurarEventos();
    }

    // ==================== CONFIGURACIÓN DE EVENTOS ====================
    configurarEventos() {
        // Evento para abrir modal de nuevo movimiento
        $(document).on('click', '.btn-mov-type', (e) => {
            const tipo = $(e.currentTarget).data('type');
            this.mostrarFormNuevo(tipo);
        });

        // Evento para enviar formulario
        $('#formMovimiento').submit((e) => this.manejarEnvioFormulario(e));

        // Evento para editar movimiento desde listas
        $(document).on('click', '.btn-editar', async (e) => {
            const movimientoId = $(e.currentTarget).data('id');
            await this.cargarMovimientoParaEditar(movimientoId);
        });

        // Evento para eliminar movimiento
        $(document).on('click', '.btn-eliminar', async (e) => {
            const movimientoId = $(e.currentTarget).data('id');
            await this.eliminarMovimiento(movimientoId);
        });
    }

    // ==================== CREAR NUEVO MOVIMIENTO ====================
    mostrarFormNuevo(tipo) {
        try {
            // Guardar referencia del botón que abrió el modal
            this.manager.lastFocusedTrigger = document.activeElement;

            // Configurar tipo de movimiento
            $('#selTipo').val(tipo);
            $('#txtMovimientoId').val('0');

            // Actualizar UI según tipo
            this.actualizarUIporTipo(tipo);

            // Obtener cuenta seleccionada
            const cuentaSeleccionada = window.obtenerCuentaSeleccionada?.();
            if (!cuentaSeleccionada) {
                toastr.warning('Por favor, selecciona una cuenta primero');
                return;
            }

            // Configurar modal
            $('#movModalLabel').text('Agregar Movimiento');
            $('#btnGuardarModal').text('Guardar Movimiento');

            // Limpiar y preparar formulario
            this.limpiarFormulario();
            this.prepararFormularioParaTipo(tipo);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('movModal'));
            modal.show();

        } catch (error) {
            console.error('Error al mostrar formulario:', error);
            toastr.error('Error al abrir el formulario');
        }
    }

    // ==================== ACTUALIZAR UI POR TIPO ====================
    actualizarUIporTipo(tipo) {
        const $badge = $('#movModalTypeBadge');
        $badge.empty();

        if (tipo === 'I') {
            $badge.append($('<span class="badge bg-success ms-2">Ingreso</span>'));
            $('#btnGuardarModal').removeClass('btn-danger').addClass('btn-success');
        } else {
            $badge.append($('<span class="badge bg-danger ms-2">Gasto</span>'));
            $('#btnGuardarModal').removeClass('btn-success').addClass('btn-danger');
        }
    }

    // ==================== PREPARAR FORMULARIO ====================
    prepararFormularioParaTipo(tipo) {
        // Renderizar categorías filtradas por tipo
        this.manager.modales.renderCategoriaGrid(tipo);

        // Establecer fecha actual por defecto
        $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

        // Enfocar campo de monto
        setTimeout(() => $('#txtMonto').focus(), 500);
    }

    // ==================== LIMPIAR FORMULARIO ====================
    limpiarFormulario() {
        $('#txtMonto').val('');
        $('#txtComentario').val('');
        $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

        // Resetear selector de categoría visual
        $('#btnCategoriaBadge').css('background', '#e9ecef').css('color', '#6c757d')
            .empty().append($('<i class="bi bi-palette"></i>'));
        $('#btnCategoriaLabel').text('Categoría');
        $('#selCategoria').val('');
    }

    // ==================== CARGAR MOVIMIENTO PARA EDITAR ====================
    async cargarMovimientoParaEditar(movimientoId) {
        try {
            if (!movimientoId) {
                toastr.warning('ID de movimiento no válido');
                return;
            }

            // Mostrar loading
            toastr.info('Cargando movimiento...');

            const response = await $.ajax({
                url: `/Movimiento/ObtenerJson?id=${movimientoId}`,
                type: 'GET',
                dataType: 'json'
            });

            if (!response.valor || !response.movimiento) {
                toastr.error('No se pudo cargar el movimiento');
                return;
            }

            const mov = response.movimiento;
            await this.mostrarFormEdicion(mov);

        } catch (error) {
            console.error('Error al cargar movimiento:', error);
            if (error.status === 404) {
                toastr.error('Movimiento no encontrado');
            } else {
                toastr.error('Error al cargar el movimiento');
            }
        }
    }

    // ==================== MOSTRAR FORMULARIO DE EDICIÓN ====================
    async mostrarFormEdicion(movimiento) {
        try {
            // Configurar modal para edición
            $('#movModalLabel').text('Editar Movimiento');
            $('#btnGuardarModal').text('Actualizar Movimiento');
            $('#txtMovimientoId').val(movimiento.movimientoId);
            $('#selTipo').val(movimiento.tipo);

            // Actualizar UI según tipo
            this.actualizarUIporTipo(movimiento.tipo);

            // Llenar campos del formulario
            $('#txtMonto').val(movimiento.monto);
            $('#txtComentario').val(movimiento.comentario || '');
            $('#txtFechaOperacion').val(movimiento.fechaOperacion);

            // Configurar categoría seleccionada
            if (movimiento.categoriaId) {
                this.manager.modales.selectCategoria(movimiento.categoriaId);
            }

            // Renderizar categorías del tipo correcto
            this.manager.modales.renderCategoriaGrid(movimiento.tipo);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('movModal'));
            modal.show();

        } catch (error) {
            console.error('Error al mostrar formulario de edición:', error);
            toastr.error('Error al cargar el formulario de edición');
        }
    }

    // ==================== MANEJAR ENVÍO DE FORMULARIO ====================
    async manejarEnvioFormulario(e) {
        e.preventDefault();

        if (!this.validarFormulario()) {
            return;
        }

        const esEdicion = $('#txtMovimientoId').val() !== '0';
        const button = $('#btnGuardarModal');
        const originalText = button.text();

        try {
            // Mostrar estado de carga
            button.prop('disabled', true).text('Guardando...');

            // Obtener datos del formulario
            const movimientoData = this.obtenerDatosFormulario();

            // Validar cuenta seleccionada
            const cuentaSeleccionada = window.obtenerCuentaSeleccionada?.();
            if (!cuentaSeleccionada) {
                toastr.warning('Por favor, selecciona una cuenta primero');
                return;
            }
            movimientoData.cuentaId = cuentaSeleccionada.cuentaId;

            // Enviar datos al servidor
            const resultado = await this.enviarDatosAlServidor(movimientoData);

            if (resultado) {
                this.manejarExitoGuardado(esEdicion);
            } else {
                throw new Error('Error en el servidor');
            }

        } catch (error) {
            this.manejarErrorGuardado(error);
        } finally {
            button.prop('disabled', false).text(originalText);
        }
    }

    // ==================== VALIDAR FORMULARIO ====================
    validarFormulario() {
        const monto = parseFloat($('#txtMonto').val());
        const categoriaId = $('#selCategoria').val();
        const fecha = $('#txtFechaOperacion').val();

        // Validar monto
        if (!monto || monto <= 0) {
            toastr.warning('Por favor ingresa un monto válido mayor a 0');
            $('#txtMonto').focus();
            return false;
        }

        // Validar categoría
        if (!categoriaId) {
            toastr.warning('Por favor selecciona una categoría');
            $('#btnCategoriaSelected').focus();
            return false;
        }

        // Validar fecha
        if (!fecha) {
            toastr.warning('Por favor selecciona una fecha');
            $('#txtFechaOperacion').focus();
            return false;
        }

        return true;
    }

    // ==================== OBTENER DATOS DEL FORMULARIO ====================
    obtenerDatosFormulario() {
        return {
            movimientoId: parseInt($('#txtMovimientoId').val()) || 0,
            cuentaId: parseInt($('#selectCuenta').val()) || 0,
            categoriaId: parseInt($('#selCategoria').val()),
            tipo: $('#selTipo').val(),
            fechaOperacion: $('#txtFechaOperacion').val(),
            monto: parseFloat($('#txtMonto').val()),
            comentario: $('#txtComentario').val().trim()
        };
    }

    // ==================== ENVIAR DATOS AL SERVIDOR ====================
    async enviarDatosAlServidor(movimientoData) {
        const response = await $.ajax({
            url: '/Movimiento/Insertar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(movimientoData),
            dataType: 'json'
        });

        if (!response.valor) {
            throw new Error(response.mensaje || 'Error al guardar el movimiento');
        }

        return response;
    }

    // ==================== MANEJAR ÉXITO AL GUARDAR ====================
    manejarExitoGuardado(esEdicion) {
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('movModal'));
        if (modal) modal.hide();

        // Mostrar mensaje de éxito
        toastr.success(esEdicion ? 'Movimiento actualizado correctamente' : 'Movimiento creado correctamente');

        // Recargar datos
        this.manager.recargarDatos();

        // Restaurar foco
        if (this.manager.lastFocusedTrigger) {
            try {
                this.manager.lastFocusedTrigger.focus();
            } catch (e) { }
        }
    }

    // ==================== MANEJAR ERROR AL GUARDAR ====================
    manejarErrorGuardado(error) {
        console.error('Error al guardar movimiento:', error);

        if (error.responseJSON) {
            const serverError = error.responseJSON;
            toastr.error(serverError.mensaje || 'Error del servidor');
        } else if (error.status === 401) {
            toastr.error('Sesión expirada. Por favor, inicia sesión nuevamente');
        } else if (error.status === 400) {
            toastr.error('Datos inválidos. Verifica la información ingresada');
        } else {
            toastr.error(error.message || 'Error al guardar el movimiento');
        }
    }

    // ==================== ELIMINAR MOVIMIENTO ====================
    async eliminarMovimiento(movimientoId) {
        if (!movimientoId) {
            toastr.warning('ID de movimiento no válido');
            return;
        }

        // Confirmar eliminación
        if (!confirm('¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await $.ajax({
                url: `/Movimiento/Eliminar?id=${movimientoId}`,
                type: 'DELETE',
                dataType: 'json'
            });

            if (response.valor) {
                toastr.success('Movimiento eliminado correctamente');
                this.manager.recargarDatos();
            } else {
                throw new Error(response.mensaje || 'Error al eliminar');
            }

        } catch (error) {
            console.error('Error al eliminar movimiento:', error);

            if (error.status === 404) {
                toastr.error('Movimiento no encontrado');
            } else if (error.status === 401) {
                toastr.error('No tienes permisos para eliminar este movimiento');
            } else {
                toastr.error('Error al eliminar el movimiento');
            }
        }
    }

    // ==================== MÉTODOS PÚBLICOS ====================
    inicializar() {
        console.log('CRUDMovimientos inicializado');
    }
}