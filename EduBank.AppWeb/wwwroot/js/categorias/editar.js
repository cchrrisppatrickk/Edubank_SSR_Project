// wwwroot/js/categorias/editar.js
class EditarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    abrirEdicion(id) {
        this.manager.categoriaSeleccionadaId = id;

        $.get(`/Categoria/ObtenerJson?id=${id}`).done((c) => {
            $('#modalTitulo').text('Editar Categoría: ' + c.nombre);
            $('#txtCategoriaId').val(c.categoriaId);
            $('#txtNombre').val(c.nombre);
            $('#txtDescripcion').val(c.descripcion || '');

            if (c.tipo === 'Gasto') {
                $('#radTipoGasto').prop('checked', true);
            } else {
                $('#radTipoIngreso').prop('checked', true);
            }

            $('#txtIcono').val(c.icono || '');
            if (c.icono) {
                $('#iconoPreview').html(`<i class="${c.icono}"></i>`);
            } else {
                $('#iconoPreview').html('<i class="bi bi-emoji-smile"></i>');
            }

            $('#txtColor').val(c.color || '#10b981');
            $('#colorPreview').css('background-color', c.color || '#10b981');
            $('#chkActivo').prop('checked', c.activo);

            $('#btnDesactivar, #btnEliminar').show();
            $('#btnDesactivar').text(c.activo ? 'Desactivar' : 'Activar');
            $('#modalEdicion').modal('show');
        }).fail(CategoriasUtils.mostrarError);
    }

    guardarCategoria(e) {
        e.preventDefault();
        const $btn = $(e.target).find('button[type="submit"]').prop('disabled', true);

        const tipo = $('input[name="tipoCategoria"]:checked').val();
        const modelo = {
            CategoriaId: parseInt($('#txtCategoriaId').val() || "0"),
            Nombre: $('#txtNombre').val(),
            Descripcion: $('#txtDescripcion').val(),
            Tipo: tipo,
            Icono: $('#txtIcono').val(),
            Color: $('#txtColor').val(),
            Activo: $('#chkActivo').is(':checked')
        };

        $.ajax(CategoriasUtils.ajaxOptions({
            url: '/Categoria/Insertar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(modelo)
        })).done((res) => {
            if (res.valor) {
                toastr.success('Guardado correctamente');
                $('#modalEdicion').modal('hide');
                this.manager.recargarLista();
            } else {
                toastr.error(res.mensaje || 'No se pudo guardar');
            }
        }).fail(CategoriasUtils.mostrarError)
            .always(() => $btn.prop('disabled', false));
    }
}