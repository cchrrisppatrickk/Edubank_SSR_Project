// wwwroot/js/movimientos/agregar.js
class AgregarMovimientos {
    constructor(manager) {
        this.manager = manager;
    }

    // Mostrar formulario para nuevo movimiento
    mostrarFormNuevo(tipo) {
        this.manager.lastFocusedTrigger = event.currentTarget;
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
        this.manager.populateCategoriaSelect(tipo);

        // Actualizar badge visual
        const $badge = $('<span>').addClass('mov-type-badge ' + (isI ? 'income' : 'expense'))
            .text(isI ? 'Ingreso' : 'Gasto');
        $('#movModalTypeBadge').empty().append($badge);

        // Actualizar título del modal
        $('#movModalLabel').contents().filter(function () {
            return this.nodeType === 3;
        }).first().replaceWith(isI ? 'Agregar ingreso ' : 'Agregar gasto ');

        // Mostrar advertencia si no hay categorías
        if ($('#selCategoria').prop('disabled')) {
            toastr.warning('No hay categorías disponibles para este tipo. Crea una categoría primero.');
        }

        // Mostrar modal
        const modalEl = document.getElementById('movModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bsModal.show();

        // Enfocar campo de monto
        setTimeout(() => $('#txtMonto').focus(), 250);
    }
}