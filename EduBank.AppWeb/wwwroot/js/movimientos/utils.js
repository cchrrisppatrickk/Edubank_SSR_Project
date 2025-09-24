// wwwroot/js/movimientos/utils.js
class MovimientosUtils {
    static token = $('input[name="__RequestVerificationToken"]').val();

    static ajaxOptions(opts) {
        if (this.token) {
            opts.headers = opts.headers || {};
            opts.headers["RequestVerificationToken"] = this.token;
        }
        return opts;
    }

    static mostrarError(xhr) {
        try {
            const json = xhr.responseJSON || JSON.parse(xhr.responseText);
            const msg = json?.mensaje || json?.message || "Error en la solicitud";
            toastr.error(msg);
        } catch (e) {
            toastr.error('Error en la solicitud');
        }
    }

    // Formateador de moneda
    static fmt(v) {
        try {
            return new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN'
            }).format(Number(v || 0));
        } catch (e) {
            return 'S/ ' + (Number(v || 0)).toFixed(2);
        }
    }

    // Generador de paleta de colores para gráficos
    static palette(n) {
        const base = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba', '#b91d47'];
        const out = [];
        for (let i = 0; i < n; i++) out.push(base[i % base.length]);
        return out;
    }

    // Funciones para determinar tipo de movimiento
    static isGasto(t) {
        return (t || '').toString().toUpperCase().startsWith('G');
    }

    static isIngreso(t) {
        return (t || '').toString().toUpperCase().startsWith('I');
    }

    // Normalizador de colores hexadecimales
    static normalizeHex(c) {
        if (!c) return null;
        c = c.toString().trim();
        if (!c) return null;
        if (c.startsWith('#')) {
            if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(c)) return c;
            return null;
        }
        if (/^[0-9A-Fa-f]{6}$/.test(c)) return '#' + c;
        if (/^[0-9A-Fa-f]{3}$/.test(c)) return '#' + c;
        return null;
    }

    // Validador de clases de iconos
    static isValidIconClass(cls) {
        if (!cls) return false;
        return /^([a-z0-9\-\s]+)$/i.test(cls);
    }

    // Calculador de color de texto según fondo
    static textColorForBg(hex) {
        try {
            const c = (hex || '#000').replace('#', '');
            const r = parseInt(c.substr(0, 2), 16);
            const g = parseInt(c.substr(2, 2), 16);
            const b = parseInt(c.substr(4, 2), 16);
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return lum > 180 ? '#000' : '#fff';
        } catch (e) {
            return '#fff';
        }
    }

    // Normalizador de tipo de categoría
    static normalizeTipo(t) {
        if (t === null || t === undefined) return null;
        const s = String(t).trim().toUpperCase();
        if (!s) return null;
        if (s.startsWith('I')) return 'I';
        if (s.startsWith('G')) return 'G';
        return null;
    }

    // Formatea a ISO yyyy-MM-dd
    static formatDateISO(d) {
        if (!(d instanceof Date)) d = new Date(d);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Debounce helper
    static debounce(fn, wait = 180) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    // Escape HTML para prevenir XSS
    static escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}