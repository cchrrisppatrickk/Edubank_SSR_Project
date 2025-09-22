// wwwroot/js/categorias/modales.js
class ModalesManager {
    constructor() {
        this.inicializarModales();
    }

    inicializarModales() {
        this.inicializarModalIconos();
        this.inicializarModalColores();
        this.configurarEventosModales();
    }

    inicializarModalIconos() {
        const gridIconos = $('#gridIconos').empty();

        CategoriasUtils.iconosDisponibles.forEach(icono => {
            const partes = icono.split(' ');
            const nombreIcono = partes[partes.length - 1].replace('bi-', '');

            const item = $('<div>').addClass('col text-center')
                .attr('data-icono', icono)
                .css('cursor', 'pointer')
                .click(() => this.seleccionarIcono(icono));

            const preview = $('<div>').addClass('mb-2').html(`<i class="${icono} fs-2"></i>`);
            const nombre = $('<div>').addClass('small text-truncate').text(nombreIcono);

            item.append(preview, nombre);
            gridIconos.append(item);
        });
    }

    inicializarModalColores() {
        const gridColores = $('#gridColores').empty();

        CategoriasUtils.coloresDisponibles.forEach(color => {
            const item = $('<div>').addClass('col text-center')
                .attr('data-color', color.valor)
                .css('cursor', 'pointer')
                .click(() => this.seleccionarColor(color.valor));

            const preview = $('<div>').addClass('mx-auto rounded-circle mb-2')
                .css({
                    'width': '50px',
                    'height': '50px',
                    'background-color': color.valor
                });
            const nombre = $('<div>').addClass('small text-truncate').text(color.nombre);

            item.append(preview, nombre);
            gridColores.append(item);
        });
    }

    seleccionarIcono(icono) {
        $('.icono-seleccionado').removeClass('icono-seleccionado border-primary');
        $('#txtIcono').val(icono);
        $('#iconoPreview').html(`<i class="${icono}"></i>`);
        $('#modalIconos').modal('hide');
    }

    seleccionarColor(color) {
        $('.color-seleccionado').removeClass('color-seleccionado border-primary');
        $('#txtColor').val(color);
        $('#colorPreview').css('background-color', color);
        $('#modalColores').modal('hide');
    }

    configurarEventosModales() {
        $('#btnSeleccionarIcono').click(() => $('#modalIconos').modal('show'));
        $('#btnSeleccionarColor').click(() => $('#modalColores').modal('show'));
    }
}