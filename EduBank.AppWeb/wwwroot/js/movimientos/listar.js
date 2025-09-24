// wwwroot/js/movimientos/listar.js
class ListarMovimientos {
    constructor(manager) {
        this.manager = manager;
    }

    // Crea elemento de lista para movimientos recientes
    crearItemLista(r) {
        const fecha = r.fechaOperacion || r.fecha || '';
        const nombre = r.categoriaNombre ?? r.categoria ??
            (this.manager.categoriasMap[Number(r.categoriaId)]?.nombre ?? '');
        const montoFmt = MovimientosUtils.fmt(Number(r.monto || 0));
        const tipo = r.tipo ?? '';

        // Obtener información de categoría
        const catFromId = this.manager.categoriasMap[Number(r.categoriaId)];
        const catFromName = this.manager.categoriasByName[(r.categoriaNombre ?? r.categoria ?? '').toString().trim().toLowerCase()];
        const catInfo = catFromId || catFromName || {};
        const icono = r.categoriaIcono ?? r.icono ?? catInfo.icono ?? '';
        const color = r.categoriaColor ?? r.color ?? catInfo.color ?? '#6c757d';

        // Crear elemento de lista
        const $li = $('<li>').addClass('list-group-item d-flex justify-content-between align-items-center py-2');

        const $left = $('<div>').addClass('small cat-cell');
        const $badge = $('<div>').addClass('cat-icon-badge')
            .css('background-color', MovimientosUtils.normalizeHex(color) || '#6c757d')
            .css('color', MovimientosUtils.textColorForBg(MovimientosUtils.normalizeHex(color) || '#6c757d'));

        // Añadir icono o inicial
        if (MovimientosUtils.isValidIconClass(icono)) {
            $badge.append($('<i>').addClass(icono));
        } else {
            $badge.text((nombre || '').substring(0, 1).toUpperCase());
        }

        $left.append($badge);
        const $meta = $('<div>');
        $meta.append($('<div>').addClass('fw-semibold').text(nombre));
        $meta.append($('<div>').addClass('text-muted small').text(fecha));
        $left.append($meta);

        const $right = $('<div>').addClass('text-end');
        $right.append($('<div>').addClass('fw-bold').text(montoFmt));
        $right.append($('<div>').addClass('small text-muted').text(tipo));

        // Contenedor para botones de acciones
        const $btnWrap = $('<div>').addClass('mt-1 d-flex gap-1');

        // Botón para editar movimiento
        const $btnEditar = $('<button>')
            .addClass('btn btn-sm btn-outline-primary btn-editar')
            .attr('type', 'button')
            .attr('title', 'Editar')
            .attr('data-id', r.movimientoId)
            .html('<i class="bi bi-pencil"></i>');

        // Botón para eliminar movimiento
        const $btnEliminar = $('<button>')
            .addClass('btn btn-sm btn-danger btn-eliminar')
            .attr('type', 'button')
            .attr('title', 'Eliminar')
            .attr('data-id', r.movimientoId)
            .html('<i class="bi bi-trash"></i>');

        $btnWrap.append($btnEditar, $btnEliminar);
        $right.append($btnWrap);
        $li.append($left).append($right);

        return $li;
    }

    // Actualizar listas de movimientos
    actualizarListas(movimientos) {
        const gastosChartList = $('#listaGastosChart').empty();
        const ingresosChartList = $('#listaIngresosChart').empty();

        const gastosRecientes = movimientos.filter(r => MovimientosUtils.isGasto(r.tipo)).slice(0, 6);
        const ingresosRecientes = movimientos.filter(r => MovimientosUtils.isIngreso(r.tipo)).slice(0, 6);

        if (!gastosRecientes.length) {
            gastosChartList.append($('<li>').addClass('list-group-item text-muted small').text('No hay movimientos recientes de gasto'));
        } else {
            gastosRecientes.forEach(r => gastosChartList.append(this.crearItemLista(r)));
        }

        if (!ingresosRecientes.length) {
            ingresosChartList.append($('<li>').addClass('list-group-item text-muted small').text('No hay movimientos recientes de ingreso'));
        } else {
            ingresosRecientes.forEach(r => ingresosChartList.append(this.crearItemLista(r)));
        }
    }
}