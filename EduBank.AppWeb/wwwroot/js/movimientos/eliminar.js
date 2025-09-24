// wwwroot/js/movimientos/eliminar.js
class EliminarMovimientos {
    constructor(manager) {
        this.manager = manager;
    }

    // Manejar eliminación de movimiento
    async eliminarMovimiento(movimientoId) {
        if (!movimientoId) {
            toastr.warning('ID de movimiento no válido');
            return;
        }

        if (!confirm('¿Está seguro de eliminar este movimiento?')) {
            return;
        }

        try {
            const res = await $.ajax({
                url: `/Movimiento/Eliminar?id=${movimientoId}`,
                type: 'DELETE',
                headers: MovimientosUtils.ajaxOptions({}).headers
            });

            if (res && res.valor) {
                toastr.success('Movimiento eliminado correctamente');
                await this.manager.recargarDatos();
            } else {
                const mensaje = res?.mensaje || res?.message || 'No se pudo eliminar el movimiento';
                toastr.error(mensaje);
            }
        } catch (error) {
            console.error('Error al eliminar movimiento:', error);
            toastr.error('Error al eliminar el movimiento');
        }
    }

    // Configurar event listeners para botones de eliminar
    configurarEventListeners() {
        // Delegación de eventos para botones de eliminar
        $(document).on('click', '.btn-eliminar', async (event) => {
            event.stopPropagation();
            const $boton = $(event.currentTarget);
            const movimientoId = $boton.data('id');

            if (!movimientoId) {
                toastr.warning('No se pudo identificar el movimiento a eliminar');
                return;
            }

            // Deshabilitar botón durante la operación
            $boton.prop('disabled', true);
            $boton.html('<i class="bi bi-hourglass-split"></i>');

            try {
                await this.eliminarMovimiento(movimientoId);
            } finally {
                // Restaurar botón
                $boton.prop('disabled', false);
                $boton.html('<i class="bi bi-trash"></i>');
            }
        });
    }
}