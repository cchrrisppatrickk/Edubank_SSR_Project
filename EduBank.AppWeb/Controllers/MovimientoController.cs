
using EduBank.BLL.Services;

// Ajusta estos usings a los namespaces reales de tus servicios/modelos/viewmodels
using EduBank.Models;
using EduBank.Models.ViewModel;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
// Interfaces de servicio
// using EduBank.BLL.Service; // si tus interfaces están en otro namespace, cámbialo

namespace EduBank.AppWeb.Controllers
{
    public class MovimientoController : Controller
    {
        private readonly IMovimientoService _movService;
        private readonly ICategoriaService _catService;

        public MovimientoController(IMovimientoService movService, ICategoriaService catService)
        {
            _movService = movService;
            _catService = catService;
        }

        // Vista principal del dashboard
        public IActionResult Index()
        {
            return View();
        }

        // Insertar o actualizar un movimiento (POST JSON)
        [HttpPost]
        public async Task<IActionResult> Insertar([FromBody] VMMovimiento vm)
        {
            if (vm == null) return BadRequest(new { valor = false, mensaje = "Datos inválidos" });
            if (vm.Monto <= 0) return BadRequest(new { valor = false, mensaje = "Monto debe ser mayor que 0" });
            if (string.IsNullOrWhiteSpace(vm.Tipo) || !(vm.Tipo == "I" || vm.Tipo == "G"))
                return BadRequest(new { valor = false, mensaje = "Tipo inválido (I=Ingreso, G=Gasto)" });

            // validar categoría
            var categoria = await _catService.Obtener(vm.CategoriaId);
            if (categoria == null) return BadRequest(new { valor = false, mensaje = "Categoría no encontrada" });

            // Parsear fecha en formato yyyy-MM-dd -> DateTime (sin hora)
            DateTime fechaOperacion;
            if (!DateTime.TryParseExact(vm.FechaOperacion, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fechaOperacion))
            {
                fechaOperacion = DateTime.Now.Date;
            }

            // Si tu entidad Movimiento usa DateTime para FechaOperacion:
            var mov = new Movimiento
            {
                MovimientoId = vm.MovimientoId, // si es 0, EF lo ignorará para insertar
                CategoriaId = vm.CategoriaId,
                Tipo = vm.Tipo,
                FechaOperacion = fechaOperacion,     // <- DateTime
                Monto = vm.Monto,
                Comentario = vm.Comentario,
                CreadoEn = DateTime.Now,
                ActualizadoEn = DateTime.Now
            };

            bool resultado;
            if (vm.MovimientoId == 0)
            {
                resultado = await _movService.Insertar(mov);
            }
            else
            {
                resultado = await _movService.Actualizar(mov);
            }

            return Ok(new { valor = resultado });
        }

        // Lista todos los movimientos (JSON)
        [HttpGet]
        public async Task<IActionResult> Lista()
        {
            var lista = await _movService.ObtenerTodos();
            var vm = lista.Select(m => new VMMovimiento
            {
                MovimientoId = m.MovimientoId,
                CategoriaId = m.CategoriaId,
                Tipo = m.Tipo,
                FechaOperacion = (m.FechaOperacion is DateTime dt) ? dt.ToString("yyyy-MM-dd") : m.FechaOperacion.ToString(), // robusto si tu modelo cambia
                Monto = m.Monto,
                Comentario = m.Comentario,
                CategoriaNombre = m.Categoria?.Nombre,
                 CategoriaIcono = m.Categoria?.Icono
            }).ToList();

            return Ok(vm);
        }

        // Obtener un movimiento por id (JSON)
        [HttpGet]
        public async Task<IActionResult> ObtenerJson(long id)
        {
            var m = await _movService.Obtener(id);
            if (m == null) return NotFound();

            // Formatear fecha (si FechaOperacion es DateTime)
            string fechaStr;
            if (m.FechaOperacion is DateTime dt)
                fechaStr = dt.ToString("yyyy-MM-dd");
            else
                fechaStr = m.FechaOperacion.ToString(); // fallback

            var vm = new VMMovimiento
            {
                MovimientoId = m.MovimientoId,
                CategoriaId = m.CategoriaId,
                Tipo = m.Tipo,
                FechaOperacion = fechaStr,
                Monto = m.Monto,
                Comentario = m.Comentario,
                CategoriaNombre = m.Categoria?.Nombre
            };

            return Ok(vm);
        }

        // Eliminar
        [HttpDelete]
        public async Task<IActionResult> Eliminar(long id)
        {
            bool ok = await _movService.Eliminar(id);
            return Ok(new { valor = ok });
        }

        // Estadísticas para dashboard: totales, saldo, totales por categoría y recientes
        // Estadisticas (modificado)
        [HttpGet]
        public async Task<IActionResult> Estadisticas()
        {
            var totalIngresos = await _movService.ObtenerTotalPorTipo('I');
            var totalGastos = await _movService.ObtenerTotalPorTipo('G');
            var saldo = totalIngresos - totalGastos;

            var totPorCat = await _movService.ObtenerTotalesPorCategoria(null);
            var recientes = (await _movService.ObtenerRecientes(10))
                .Select(m => new
                {
                    m.MovimientoId,
                    m.CategoriaId,
                    CategoriaNombre = m.Categoria?.Nombre,
                    CategoriaIcono = m.Categoria?.Icono, // <- aquí
                    m.Tipo,
                    FechaOperacion = (m.FechaOperacion is DateTime d) ? d.ToString("yyyy-MM-dd") : m.FechaOperacion.ToString(),
                    m.Monto,
                    m.Comentario
                });

            return Ok(new
            {
                TotalIngresos = totalIngresos,
                TotalGastos = totalGastos,
                Saldo = saldo,
                TotalesPorCategoria = totPorCat.Select(t => new { t.CategoriaId, t.CategoriaNombre, t.Total }),
                Recientes = recientes
            });
        }


        // Totales por categoría filtrando por tipo (I o G)
        [HttpGet]
        public async Task<IActionResult> TotalesPorCategoria(char tipo)
        {
            if (tipo != 'I' && tipo != 'G')
                return BadRequest(new { valor = false, mensaje = "Tipo inválido" });

            var data = await _movService.ObtenerTotalesPorCategoria(tipo);
            return Ok(data.Select(d => new { d.CategoriaId, d.CategoriaNombre, d.Total }));
        }



        ///Nueva actualización de filtrado por fechas 

        // Endpoint para obtener movimientos filtrados por período
        [HttpGet]
        public async Task<IActionResult> ObtenerPorPeriodo(string periodo, string fecha)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(periodo) || string.IsNullOrEmpty(fecha))
                    return BadRequest(new { valor = false, mensaje = "Parámetros incompletos" });

                // Parsear fecha
                if (!DateTime.TryParseExact(fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime fechaReferencia))
                    return BadRequest(new { valor = false, mensaje = "Formato de fecha inválido" });

                // Validar período
                var periodosValidos = new[] { "dia", "semana", "mes", "año" };
                if (!periodosValidos.Contains(periodo.ToLower()))
                    return BadRequest(new { valor = false, mensaje = "Período no válido" });

                // Obtener movimientos
                var movimientos = await _movService.ObtenerPorPeriodo(periodo, fechaReferencia);

                // Obtener rango del período para la respuesta
                var rango = await _movService.ObtenerRangoPeriodo(periodo, fechaReferencia);

                // Calcular totales
                var totalIngresos = movimientos.Where(m => m.Tipo == "I").Sum(m => m.Monto);
                var totalGastos = movimientos.Where(m => m.Tipo == "G").Sum(m => m.Monto);
                var saldo = totalIngresos - totalGastos;

                // Convertir a ViewModel
                var vm = movimientos.Select(m => new VMMovimiento
                {
                    MovimientoId = m.MovimientoId,
                    CategoriaId = m.CategoriaId,
                    Tipo = m.Tipo,
                    FechaOperacion = m.FechaOperacion.ToString("yyyy-MM-dd"),
                    Monto = m.Monto,
                    Comentario = m.Comentario,
                    CategoriaNombre = m.Categoria?.Nombre,
                    CategoriaIcono = m.Categoria?.Icono
                }).ToList();

                return Ok(new
                {
                    valor = true,
                    movimientos = vm,
                    totalIngresos,
                    totalGastos,
                    saldo,
                    rango = new
                    {
                        inicio = rango.Inicio.ToString("yyyy-MM-dd"),
                        fin = rango.Fin.ToString("yyyy-MM-dd")
                    },
                    periodoActual = periodo,
                    fechaReferencia = fechaReferencia.ToString("yyyy-MM-dd")
                });
            }
            catch (Exception ex)
            {
                // Log error
                return StatusCode(500, new { valor = false, mensaje = "Error interno del servidor", detalle = ex.Message });
            }
        }

        // Endpoint para obtener estadísticas por período
        [HttpGet]
        public async Task<IActionResult> EstadisticasPorPeriodo(string periodo, string fecha)
        {
            try
            {
                // Validar parámetros
                if (string.IsNullOrEmpty(periodo) || string.IsNullOrEmpty(fecha))
                    return BadRequest(new { valor = false, mensaje = "Parámetros incompletos" });

                // Parsear fecha
                if (!DateTime.TryParseExact(fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime fechaReferencia))
                    return BadRequest(new { valor = false, mensaje = "Formato de fecha inválido" });

                // Validar período
                var periodosValidos = new[] { "dia", "semana", "mes", "año" };
                if (!periodosValidos.Contains(periodo.ToLower()))
                    return BadRequest(new { valor = false, mensaje = "Período no válido" });

                // Obtener movimientos
                var movimientos = await _movService.ObtenerPorPeriodo(periodo, fechaReferencia);

                // Calcular totales
                var totalIngresos = movimientos.Where(m => m.Tipo == "I").Sum(m => m.Monto);
                var totalGastos = movimientos.Where(m => m.Tipo == "G").Sum(m => m.Monto);
                var saldo = totalIngresos - totalGastos;

                // Calcular totales por categoría
                var ingresosPorCategoria = movimientos
                    .Where(m => m.Tipo == "I")
                    .GroupBy(m => new { m.CategoriaId, m.Categoria.Nombre })
                    .Select(g => new { g.Key.CategoriaId, g.Key.Nombre, Total = g.Sum(m => m.Monto) })
                    .OrderByDescending(x => x.Total);

                var gastosPorCategoria = movimientos
                    .Where(m => m.Tipo == "G")
                    .GroupBy(m => new { m.CategoriaId, m.Categoria.Nombre })
                    .Select(g => new { g.Key.CategoriaId, g.Key.Nombre, Total = g.Sum(m => m.Monto) })
                    .OrderByDescending(x => x.Total);

                // Obtener rango del período
                var rango = await _movService.ObtenerRangoPeriodo(periodo, fechaReferencia);

                return Ok(new
                {
                    valor = true,
                    totalIngresos,
                    totalGastos,
                    saldo,
                    ingresosPorCategoria,
                    gastosPorCategoria,
                    rango = new
                    {
                        inicio = rango.Inicio.ToString("yyyy-MM-dd"),
                        fin = rango.Fin.ToString("yyyy-MM-dd")
                    },
                    periodoActual = periodo,
                    fechaReferencia = fechaReferencia.ToString("yyyy-MM-dd")
                });
            }
            catch (Exception ex)
            {
                // Log error
                return StatusCode(500, new { valor = false, mensaje = "Error interno del servidor", detalle = ex.Message });
            }
        }




    }
}
