// wwwroot/js/categorias/index.js
class CategoriasManager {
    constructor() {
        this.categoriaSeleccionadaId = 0;

        // Inicializar módulos
        this.utils = CategoriasUtils;
        this.modales = new ModalesManager();
        this.listar = new ListarCategorias(this);
        this.agregar = new AgregarCategorias(this);
        this.editar = new EditarCategorias(this);
        this.eliminar = new EliminarCategorias(this);

        this.init();
    }

    init() {
        this.bindEvents();
        this.listar.cargarCategorias();
        this.configurarAnimacionesModales();
    }

    bindEvents() {
        // Formulario principal
        $('#formCategoria').submit((e) => this.editar.guardarCategoria(e));

        // Botones de acción
        $('#btnEliminar').click(() => this.eliminar.eliminarCategoria());
        $('#btnDesactivar').click(() => this.eliminar.cambiarEstado());

        // Función global para agregar
        window.mostrarFormNuevo = (tipo) => this.agregar.mostrarFormNuevo(tipo);
    }

    recargarLista() {
        $('#formCategoria')[0].reset();
        $('#txtCategoriaId').val('0');
        this.categoriaSeleccionadaId = 0;
        $('.categoria-card').removeClass('border-primary');
        this.listar.cargarCategorias();
    }

    configurarAnimacionesModales() {
        $(document).on('show.bs.modal', '.modal', (e) => {
            const dlg = $(e.target).find('.modal-dialog');
            dlg.css('will-change', 'transform, opacity');
            requestAnimationFrame(() => dlg.addClass('modal-open-anim'));
        });

        $(document).on('hidden.bs.modal', '.modal', (e) => {
            const dlg = $(e.target).find('.modal-dialog');
            dlg.removeClass('modal-open-anim');
            dlg.css('will-change', 'auto');
        });
    }
    bindEvents() {
        // Formulario principal (editar existente)
        $('#formCategoria').submit((e) => this.editar.guardarCategoria(e));

        // Botones de acción
        $('#btnEliminar').click(() => this.eliminar.eliminarCategoria());
        $('#btnDesactivar').click(() => this.eliminar.cambiarEstado());

        // Botón para guardar nueva categoría
        $('#btnGuardarCategoria').click(() => this.agregar.guardarNuevaCategoria());

        // Función global para abrir el modal de nueva categoría
        window.mostrarFormNuevo = (tipo) => this.agregar.mostrarFormNuevo(tipo);
    }

}

// Inicialización cuando el DOM esté listo
$(document).ready(() => {
    window.categoriasApp = new CategoriasManager();
});