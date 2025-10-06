class ListarCategorias {
    constructor(manager) {
        this.manager = manager;
    }

    async cargarCategorias() {
        try {
            const data = await $.get('/Categoria/Lista');
            console.log("Categorías recibidas:", data);

            if (!Array.isArray(data)) {
                console.error("La respuesta no es una lista válida");
                return;
            }

            this.renderCategorias(data);
        } catch (err) {
            console.error("Error al cargar categorías:", err);
            CategoriasUtils.mostrarError("Error al cargar las categorías");

            if (err.status === 401) window.location.href = '/Acceso/Login';
        }
    }

    renderCategorias(lista) {
        const gastosGrid = $('#gastos-grid').empty();
        const ingresosGrid = $('#ingresos-grid').empty();

        const gastos = lista.filter(c => c.tipo === 'G' || c.tipo === 'Gasto');
        const ingresos = lista.filter(c => c.tipo === 'I' || c.tipo === 'Ingreso');

        // Gastos
        if (gastos.length > 0)
            gastos.forEach(c => gastosGrid.append(this.crearCard(c)));
        else
            gastosGrid.append(this.crearCardVacio('gastos'));

        // Ingresos
        if (ingresos.length > 0)
            ingresos.forEach(c => ingresosGrid.append(this.crearCard(c)));
        else
            ingresosGrid.append(this.crearCardVacio('ingresos'));

        this.actualizarContadores(gastos.length, ingresos.length);
    }


    crearCard(c) {
        const card = $('<div>')
            .addClass('col')
            .attr('data-id', c.categoriaId)
            .data('categoria', c);

        const cardBody = $('<div>')
            .addClass('card h-100 categoria-card')
            .css('cursor', 'pointer')
            .toggleClass('border-primary', c.categoriaId === this.manager.categoriaSeleccionadaId)
            .toggleClass('opacity-50', !c.activo);

        const circulo = $('<div>').addClass('rounded-circle mx-auto mt-3')
            .css({
                'width': '80px',
                'height': '80px',
                'background-color': c.color || '#6c757d',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'border': '3px solid ' + (c.color || '#6c757d')
            });

        if (c.icono) {
            circulo.html(`<i class="${c.icono} fs-4 text-white"></i>`);
        } else {
            const inicial = (c.nombre || '').substring(0, 1).toUpperCase();
            circulo.text(inicial)
                .css('color', 'white')
                .css('font-weight', 'bold')
                .css('font-size', '1.5rem');
        }

        const nombre = $('<div>')
            .addClass('card-title text-center mt-2 mb-1 fw-semibold')
            .text(c.nombre)
            .css('font-size', '0.9rem');

        const tipo = $('<div>')
            .addClass('card-text small text-center')
            .text(c.tipo === 'I' ? 'Ingreso' : 'Gasto')
            .addClass(c.tipo === 'I' ? 'text-success' : 'text-danger');

        const estado = $('<div>')
            .addClass('card-text text-center')
            .html(c.activo ?
                '<span class="badge bg-success">Activo</span>' :
                '<span class="badge bg-secondary">Inactivo</span>'
            )
            .css('font-size', '0.7rem');

        cardBody.append(circulo, nombre, tipo, estado);
        card.append(cardBody);

        // Evento click para editar
        card.click(() => {
            if (!c.activo) {
                CategoriasUtils.mostrarInfo('Esta categoría está inactiva');
                return;
            }

            $('.categoria-card').removeClass('border-primary');
            cardBody.addClass('border-primary');
            this.manager.editar.abrirEdicion(c.categoriaId);
        });

        return card;
    }

    crearCardVacio(tipo) {
        const mensaje = tipo === 'gastos' ?
            'No hay categorías de gastos registradas' :
            'No hay categorías de ingresos registradas';

        const col = $('<div>').addClass('col-12');
        const card = $('<div>').addClass('card text-center py-5');
        const cardBody = $('<div>').addClass('card-body');

        const icono = $('<i>')
            .addClass('bi bi-folder-x text-muted mb-3')
            .css('font-size', '3rem');

        const texto = $('<p>')
            .addClass('text-muted mb-3')
            .text(mensaje);

        const boton = $('<button>')
            .addClass('btn btn-primary btn-sm')
            .html(`<i class="bi bi-plus-circle me-1"></i>Agregar ${tipo === 'gastos' ? 'Gasto' : 'Ingreso'}`)
            .click(() => {
                window.mostrarFormNuevo(tipo === 'gastos' ? 'G' : 'I');
            });

        cardBody.append(icono, texto, boton);
        card.append(cardBody);
        col.append(card);

        return col;
    }

    actualizarContadores(gastosCount, ingresosCount) {
        // Actualizar los tabs con contadores
        $('#gastos-tab').html(`Gastos ${gastosCount > 0 ? `<span class="badge bg-danger ms-1">${gastosCount}</span>` : ''}`);
        $('#ingresos-tab').html(`Ingresos ${ingresosCount > 0 ? `<span class="badge bg-success ms-1">${ingresosCount}</span>` : ''}`);

        // Actualizar subtítulos
        $('.section-title').each(function () {
            const $this = $(this);
            if ($this.text().includes('Gastos')) {
                $this.text(`Gastos Registrados ${gastosCount > 0 ? `(${gastosCount})` : ''}`);
            } else if ($this.text().includes('Ingresos')) {
                $this.text(`Ingresos Registrados ${ingresosCount > 0 ? `(${ingresosCount})` : ''}`);
            }
        });
    }

    mostrarMensajeSinCategorias() {
        const mensaje = `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="bi bi-folder-x text-muted mb-3" style="font-size: 3rem;"></i>
                        <h5 class="text-muted mb-3">No hay categorías registradas</h5>
                        <p class="text-muted mb-3">Comienza creando tu primera categoría de gastos o ingresos.</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-success btn-sm" onclick="mostrarFormNuevo('G')">
                                <i class="bi bi-plus-circle me-1"></i>Agregar Gasto
                            </button>
                            <button class="btn btn-success btn-sm" onclick="mostrarFormNuevo('I')">
                                <i class="bi bi-plus-circle me-1"></i>Agregar Ingreso
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#gastos-grid').html(mensaje);
        $('#ingresos-grid').html(mensaje);
    }
}