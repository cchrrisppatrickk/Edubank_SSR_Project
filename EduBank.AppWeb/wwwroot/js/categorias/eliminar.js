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
        const id = parseInt($('#txtCategoriaId').val());
        if (id === 0 || isNaN(id)) {
            toastr.error('ID de categoría inválido');
            return;
        }

        const activo = !$('#chkActivo').is(':checked');

        // Validar que los datos sean correctos
        console.log('Enviando:', { CategoriaId: id, Activo: activo });

        $.ajax(CategoriasUtils.ajaxOptions({
            url: '/Categoria/CambiarEstado',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                CategoriaId: id,
                Activo: activo
            })
        })).done((res) => {
            if (res.valor) {
                toastr.success('Estado actualizado correctamente');
                $('#chkActivo').prop('checked', activo);
                $('#btnDesactivar').text(activo ? 'Desactivar' : 'Activar');
                this.manager.recargarLista();
            } else {
                toastr.error(res.mensaje || 'No se pudo actualizar el estado');
            }
        }).fail((xhr, status, error) => {
            console.error('Error en cambiarEstado:', error);
            toastr.error('Error al comunicarse con el servidor');
        });
    }
}