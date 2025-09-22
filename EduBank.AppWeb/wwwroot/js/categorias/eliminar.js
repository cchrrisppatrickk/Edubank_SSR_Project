// wwwroot/js/categorias/eliminar.js
class EliminarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    eliminarCategoria() {
        const id = $('#txtCategoriaId').val();
        if (id === "0") return;

        if (!confirm('¿Eliminar categoría?')) return;

        $.ajax(CategoriasUtils.ajaxOptions({
            url: `/Categoria/Eliminar?id=${id}`,
            type: 'DELETE'
        })).done((res) => {
            if (res.valor) {
                toastr.success('Eliminado');
                $('#modalEdicion').modal('hide');
                this.manager.recargarLista();
            } else {
                toastr.error(res.mensaje || 'No se pudo eliminar');
            }
        }).fail(CategoriasUtils.mostrarError);
    }

    cambiarEstado() {
        const id = $('#txtCategoriaId').val();
        if (id === "0") return;

        const activo = !$('#chkActivo').is(':checked');

        $.ajax(CategoriasUtils.ajaxOptions({
            url: '/Categoria/CambiarEstado',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ CategoriaId: id, Activo: activo })
        })).done((res) => {
            if (res.valor) {
                toastr.success('Estado actualizado');
                $('#chkActivo').prop('checked', activo);
                $('#btnDesactivar').text(activo ? 'Desactivar' : 'Activar');
                this.manager.recargarLista();
            } else {
                toastr.error(res.mensaje || 'No se pudo actualizar');
            }
        }).fail(CategoriasUtils.mostrarError);
    }
}