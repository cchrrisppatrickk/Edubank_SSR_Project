// wwwroot/js/movimientos/modales.js
class ModalesMovimientos {
    constructor(manager) {
        this.manager = manager;
    }

    // Renderizar cuadrícula de categorías en modal
    renderCategoriaGrid(tipo) {
        const $grid = $('#gridCategorias').empty();
        const entries = Object.entries(this.manager.categoriasMap || {});

        const filtered = entries.filter(([id, info]) => {
            if (!tipo) return true;
            const t = MovimientosUtils.normalizeTipo(info.tipo || info.Tipo);
            return t === tipo;
        });

        if (!filtered.length) {
            $grid.append($('<div>').addClass('col-12 text-center text-muted small')
                .text('No hay categorías para mostrar'));
            return;
        }

        // Ordenar y mostrar categorías
        filtered.sort((a, b) => (a[1].nombre || '').localeCompare(b[1].nombre || ''));

        filtered.forEach(([id, info]) => {
            const color = MovimientosUtils.normalizeHex(info.color) || '#6c757d';
            const $col = $('<div>').addClass('col');
            const $card = $('<div>')
                .addClass('categoria-card')
                .attr('tabindex', 0)
                .attr('role', 'button')
                .attr('aria-pressed', 'false')
                .css('background', '#fff')
                .on('click keypress', (e) => {
                    if (e.type === 'click' || (e.type === 'keypress' && (e.key === 'Enter' || e.key === ' '))) {
                        this.selectCategoria(Number(id));
                    }
                });

            const $badge = $('<div>')
                .addClass('cat-icon-badge')
                .css('margin', '0 auto')
                .css('background-color', color)
                .css('color', MovimientosUtils.textColorForBg(color));

            if (MovimientosUtils.isValidIconClass(info.icono)) {
                $badge.append($('<i>').addClass(info.icono));
            } else {
                $badge.text((info.nombre || '').substring(0, 1).toUpperCase());
            }

            $card.append($badge);
            $card.append($('<div>').addClass('categoria-label').text(info.nombre));
            $col.append($card);
            $grid.append($col);
        });
    }

    // Seleccionar categoría desde modal
    selectCategoria(id) {
        const item = this.manager.categoriasMap[id];
        if (!item) return;

        $('#selCategoria').val(id);
        const color = MovimientosUtils.normalizeHex(item.color) || '#6c757d';
        const $badge = $('#btnCategoriaBadge');
        const $label = $('#btnCategoriaLabel');

        // Actualizar badge visual
        $badge.css('background-color', color);
        $badge.css('color', MovimientosUtils.textColorForBg(color));
        $badge.empty();

        if (MovimientosUtils.isValidIconClass(item.icono)) {
            $badge.append($('<i>').addClass(item.icono));
        } else {
            $badge.text((item.nombre || '').substring(0, 1).toUpperCase());
        }

        $label.text(item.nombre);

        // Cerrar modal
        const modalEl = document.getElementById('modalCategorias');
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
    }

    // Configurar eventos de modales
    configurarEventosModales() {
        // Evento para abrir modal de selección de categorías
        $('#btnCategoriaSelected').on('click', (e) => {
            e.preventDefault();
            const modalEl = document.getElementById('modalCategorias');
            const bsModal = new bootstrap.Modal(modalEl, { keyboard: true });
            const tipo = $('#selTipo').val() || 'G';

            this.renderCategoriaGrid(tipo);
            this.manager.lastFocusedTrigger = e.currentTarget;
            bsModal.show();
        });

        // Restaurar foco al cerrar modal principal
        $('#movModal').on('hidden.bs.modal', () => {
            $('#selTipo').val('G');
            $('#movModalTypeBadge').empty();

            if (this.manager.lastFocusedTrigger) {
                try {
                    this.manager.lastFocusedTrigger.focus();
                } catch (e) { }
            }
        });

        // Evento para cambiar entre pestañas (actualizar gráficos)
        $('#movimientosTabs').on('shown.bs.tab', (e) => {
            const targetId = e.target?.id || '';

            if (targetId === 'gastos-tab' && this.manager.graficos.chartGastos) {
                try {
                    this.manager.graficos.chartGastos.resize();
                    this.manager.graficos.chartGastos.update();
                } catch (err) { }
            }

            if (targetId === 'ingresos-tab' && this.manager.graficos.chartIngresos) {
                try {
                    this.manager.graficos.chartIngresos.resize();
                    this.manager.graficos.chartIngresos.update();
                } catch (err) { }
            }
        });
    }

    // Inicializar modales
    inicializar() {
        this.configurarEventosModales();
    }
}