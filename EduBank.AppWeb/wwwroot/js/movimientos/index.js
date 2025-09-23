// wwwroot/js/movimientos/index.js
class MovimientosManager {
    constructor() {
        this.categoriasMap = {};
        this.categoriasByName = {};
        this.utils = MovimientosUtils;
        this.init();
    }

    async init() {
        // Configurar toastr
        toastr.options = this.utils.toastrConfig;

        // Inicializar módulos
        this.graficos = new GraficosManager(this);
        this.crud = new CRUDManager(this);

        // Cargar datos iniciales
        await this.cargarCategorias();
        await this.crud.cargarEstadisticas();
        await this.crud.fetchPorPeriodo(this.graficos.currentPeriod, this.graficos.currentDate);
    }

    async cargarCategorias() {
        try {
            const res = await $.get('/Categoria/Lista');
            this.categoriasMap = {};
            this.categoriasByName = {};

            (res || []).forEach(c => {
                const id = Number(c.categoriaId);
                const nombre = (c.nombre || '').toString();
                const item = {
                    nombre: nombre,
                    icono: c.icono || '',
                    color: c.color || '',
                    tipo: (c.tipo ?? c.Tipo ?? '').toString()
                };
                this.categoriasMap[id] = item;
                if (nombre) this.categoriasByName[nombre.trim().toLowerCase()] = item;
            });
        } catch (err) {
            this.categoriasMap = {};
            this.categoriasByName = {};
            toastr.warning('No se pudieron cargar las categorías');
        }
    }
}

// Inicialización cuando el DOM esté listo
$(document).ready(() => {
    window.movimientosApp = new MovimientosManager();
});