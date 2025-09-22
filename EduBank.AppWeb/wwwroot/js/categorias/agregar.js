// wwwroot/js/categorias/agregar.js
class AgregarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    mostrarFormNuevo(tipo) {
        this.manager.categoriaSeleccionadaId = 0;
        $('.categoria-card').removeClass('border-primary');

        $('#modalTitulo').text('Nueva Categoría de ' + tipo);
        $('#txtCategoriaId').val('0');
        $('#txtNombre').val('');
        $('#txtDescripcion').val('');

        if (tipo === 'Gasto') {
            $('#radTipoGasto').prop('checked', true);
        } else {
            $('#radTipoIngreso').prop('checked', true);
        }

        $('#txtIcono').val('');
        $('#iconoPreview').html('<i class="bi bi-emoji-smile"></i>');
        $('#txtColor').val('#10b981');
        $('#colorPreview').css('background-color', '#10b981');
        $('#chkActivo').prop('checked', true);

        $('#btnDesactivar, #btnEliminar').hide();
        $('#modalEdicion').modal('show');
    }
}