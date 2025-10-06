// wwwroot/js/categorias/agregar.js
class AgregarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    mostrarFormNuevo(tipo) {
        // Reiniciar formulario
        $('#formCategoria')[0].reset();
        $('#txtCategoriaId').val(0);
        $('#txtTipo').val(tipo);

        // Cambiar título dinámico
        const tipoTexto = tipo === 'I' ? 'Ingreso' : 'Gasto';
        $('#tituloModalCategoria').text(`Nueva Categoría de ${tipoTexto}`);

        // Resetear previews
        $('#iconoPreview').html('<i class="bi bi-plus-circle"></i>');
        $('#colorPreview').css('background-color', '#6c757d');

        // Mostrar modal
        $('#modalCategoria').modal('show');
    }

    async guardarNuevaCategoria() {
        try {
            const modelo = {
                categoriaId: 0,
                nombre: $('#txtNombre').val().trim(),
                descripcion: $('#txtDescripcion').val(),
                tipo: $('#txtTipo').val(),
                icono: $('#txtIcono').val(),
                color: $('#txtColor').val(),
            };

            // Validaciones simples
            if (!modelo.nombre) {
                toastr.warning('El nombre es obligatorio');
                return;
            }

            const opciones = CategoriasUtils.ajaxOptions({
                url: '/Categoria/Insertar',
                type: 'POST',
                data: JSON.stringify(modelo),
                contentType: 'application/json',
            });

            const res = await $.ajax(opciones);

            if (res.valor) {
                toastr.success('Categoría registrada exitosamente');
                $('#modalCategoria').modal('hide');
                this.manager.recargarLista();
            } else {
                toastr.error(res.mensaje || 'Error al registrar');
            }
        } catch (err) {
            CategoriasUtils.mostrarError(err);
        }
    }
}
