// wwwroot/js/movimientos/editar.js
class EditarMovimientos {
    constructor(manager) {
        this.manager = manager;
    }

    // Cargar datos de un movimiento para editar
    async cargarMovimientoParaEditar(movimientoId) {
        try {
            const res = await $.get(`/Movimiento/ObtenerJson?id=${movimientoId}`);
            if (res && res.movimientoId) {
                this.llenarFormularioEdicion(res);
                this.mostrarModalEdicion();
            } else {
                toastr.error('No se pudieron cargar los datos del movimiento');
            }
        } catch (err) {
            toastr.error('Error al cargar el movimiento para editar');
            console.error('Error al cargar movimiento:', err);
        }
    }

    // Llenar formulario con datos del movimiento
    llenarFormularioEdicion(res) {
        $('#txtMovimientoId').val(res.movimientoId);
        $('#selTipo').val(res.tipo || 'G');
        $('#selCategoria').val(res.categoriaId || 0);
        $('#txtFechaOperacion').val(MovimientosUtils.formatDateISO(new Date(res.fechaOperacion)));
        $('#txtMonto').val(Number(res.monto || 0).toFixed(2));
        $('#txtComentario').val(res.comentario || '');

        // Actualizar visualización de la categoría seleccionada
        this.actualizarVisualizacionCategoria(res.categoriaId);

        // Actualizar badge visual del tipo
        const isI = (res.tipo === 'I');
        const $badgeType = $('<span>').addClass('mov-type-badge ' + (isI ? 'income' : 'expense'))
            .text(isI ? 'Ingreso' : 'Gasto');
        $('#movModalTypeBadge').empty().append($badgeType);

        // Actualizar título del modal
        $('#movModalLabel').contents().filter(function () {
            return this.nodeType === 3;
        }).first().replaceWith(isI ? 'Editar ingreso ' : 'Editar gasto ');

        // Mostrar mensaje informativo para edición
        this.mostrarMensajeEdicion();
    }

    // Actualizar visualización de categoría
    actualizarVisualizacionCategoria(categoriaId) {
        const catInfo = this.manager.categoriasMap[Number(categoriaId)];
        const $badge = $('#btnCategoriaBadge');
        const $label = $('#btnCategoriaLabel');

        if (catInfo) {
            const color = MovimientosUtils.normalizeHex(catInfo.color) || '#6c757d';
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
            $label.text('Categoría no encontrada');
            $badge.css('background-color', '#dc3545')
                .css('color', 'white')
                .empty()
                .append($('<i>').addClass('bi bi-exclamation-triangle'));
        }
    }

    // Mostrar mensaje informativo para edición
    mostrarMensajeEdicion() {
        if (!$('#edicionInfo').length) {
            const $info = $('<div id="edicionInfo" class="alert alert-info alert-dismissible fade show small mt-2 mb-0"></div>');
            $info.html('<i class="bi bi-info-circle me-1"></i>La categoría actual se mantendrá si no selecciona una nueva. <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>');
            $('#formMovimiento .modal-body').prepend($info);
        } else {
            $('#edicionInfo').show();
        }
    }

    // Mostrar modal de edición
    mostrarModalEdicion() {
        const modalEl = document.getElementById('movModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bsModal.show();
        setTimeout(() => $('#txtMonto').focus(), 250);
    }

    // Manejar envío del formulario de edición
    async manejarEnvioFormulario(e) {
        e.preventDefault();
        const $btn = $(e.target).find('button[type="submit"]');

        if (!$btn.data('original-html')) {
            $btn.data('original-html', $btn.html());
        }

        $btn.prop('disabled', true);
        $btn.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');

        try {
            const modelo = this.prepararModelo();
            await this.validarModelo(modelo);
            await this.enviarModelo(modelo);
        } catch (error) {
            console.error('Error en guardado:', error);
            toastr.error('Error al guardar: ' + (error.message || 'Error desconocido'));
        } finally {
            $btn.prop('disabled', false);
            $btn.html($btn.data('original-html'));
        }
    }

    // Preparar modelo del formulario
    prepararModelo() {
        const movimientoId = Number($('#txtMovimientoId').val() || 0);
        const categoriaSeleccionada = Number($('#selCategoria').val() || 0);

        return {
            MovimientoId: movimientoId,
            CategoriaId: categoriaSeleccionada,
            Tipo: $('#selTipo').val(),
            FechaOperacion: $('#txtFechaOperacion').val(),
            Monto: Number($('#txtMonto').val() || 0),
            Comentario: $('#txtComentario').val()
        };
    }

    // Validar modelo antes de enviar
    async validarModelo(modelo) {
        // Validaciones básicas
        if (!(modelo.Monto > 0)) {
            throw new Error('Ingrese un monto válido mayor a 0');
        }

        // Manejo especial para edición: mantener categoría original si no se cambió
        const esEdicion = modelo.MovimientoId > 0;
        if (esEdicion && (!modelo.CategoriaId || modelo.CategoriaId === 0)) {
            const movimientoOriginal = await $.get(`/Movimiento/ObtenerJson?id=${modelo.MovimientoId}`);
            if (movimientoOriginal && movimientoOriginal.categoriaId) {
                modelo.CategoriaId = movimientoOriginal.categoriaId;
            } else {
                throw new Error('No se pudo obtener la categoría original del movimiento');
            }
        } else if (!esEdicion && (!modelo.CategoriaId || modelo.CategoriaId === 0)) {
            throw new Error('Seleccione una categoría');
        }

        // Validación de tipo de categoría
        if (modelo.CategoriaId && modelo.CategoriaId !== 0) {
            const catInfo = this.manager.categoriasMap[modelo.CategoriaId];
            if (!catInfo) {
                throw new Error('Categoría inválida');
            }

            const tipoCategoria = MovimientosUtils.normalizeTipo(catInfo.tipo);
            const tipoMovimiento = MovimientosUtils.normalizeTipo(modelo.Tipo);

            if (tipoCategoria !== tipoMovimiento) {
                throw new Error('La categoría seleccionada no corresponde al tipo de movimiento.');
            }
        }
    }

    // Enviar modelo al servidor
    async enviarModelo(modelo) {
        const esEdicion = modelo.MovimientoId > 0;
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
            this.limpiarFormulario(!esEdicion);
            this.cerrarModal();
            await this.manager.recargarDatos();
        } else {
            const msg = (res && (res.mensaje || res.message)) || 'No se pudo guardar';
            throw new Error(msg);
        }
    }

    // Limpiar formulario después del guardado
    limpiarFormulario(esCreacion) {
        if (esCreacion) {
            $('#formMovimiento')[0].reset();
            $('#txtMovimientoId').val(0);
            $('#txtFechaOperacion').val(new Date().toISOString().split('T')[0]);

            $('#btnCategoriaBadge').css('background-color', '#e9ecef')
                .css('color', '#6c757d')
                .empty()
                .append($('<i>').addClass('bi bi-palette'));
            $('#btnCategoriaLabel').text('Categoría');
        }
    }

    // Cerrar modal
    cerrarModal() {
        const modalEl = document.getElementById('movModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
    }
}