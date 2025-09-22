// wwwroot/js/categorias/listar.js
class ListarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    async cargarCategorias() {
        try {
            const data = await $.get('/Categoria/Lista');
            this.renderCategorias(data);
        } catch (err) {
            CategoriasUtils.mostrarError(err);
        }
    }

    renderCategorias(lista) {
        const gastosGrid = $('#gastos-grid').empty();
        const ingresosGrid = $('#ingresos-grid').empty();

        lista.forEach(c => {
            if (c.tipo === 'Ingreso') {
                ingresosGrid.append(this.crearCard(c));
            } else {
                gastosGrid.append(this.crearCard(c));
            }
        });
    }

    crearCard(c) {
        const card = $('<div>')
            .addClass('col')
            .attr('data-id', c.categoriaId)
            .data('categoria', c);

        const cardBody = $('<div>')
            .addClass('card h-100 categoria-card')
            .css('cursor', 'pointer')
            .toggleClass('border-primary', c.categoriaId === this.manager.categoriaSeleccionadaId);

        const circulo = $('<div>').addClass('rounded-circle mx-auto mt-3')
            .css({
                'width': '80px',
                'height': '80px',
                'background-color': c.color || '#e9ecef',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center'
            });

        if (c.icono) {
            circulo.html(`<i class="${c.icono} fs-4 text-white fw-bold"></i>`);
        } else {
            const inicial = (c.nombre || '').substring(0, 1).toUpperCase();
            circulo.text(inicial).css('color', 'white').css('font-weight', 'bold');
        }

        const nombre = $('<div>').addClass('card-title text-center mt-2 mb-1').text(c.nombre);
        const tipo = $('<div>').addClass('card-text small text-muted text-center').text(c.tipo);

        cardBody.append(circulo, nombre, tipo);
        card.append(cardBody);

        // Evento click para editar
        card.click(() => {
            $('.categoria-card').removeClass('border-primary');
            cardBody.addClass('border-primary');
            this.manager.editar.abrirEdicion(c.categoriaId);
        });

        return card;
    }
}