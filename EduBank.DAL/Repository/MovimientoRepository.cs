using EduBank.DAL.DataContext;
using EduBank.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.DAL.Repository
{
    public class MovimientoRepository : IMovimientoRepository
    {
        private readonly EdubanckssrContext _db;
        public MovimientoRepository(EdubanckssrContext context) { _db = context; }

        public async Task<bool> Insertar(Movimiento modelo)
        {
            await _db.Movimientos.AddAsync(modelo);
            return await _db.SaveChangesAsync() > 0;
        }

        public async Task<bool> Actualizar(Movimiento modelo)
        {
            modelo.ActualizadoEn = DateTime.Now;
            _db.Movimientos.Update(modelo);
            return await _db.SaveChangesAsync() > 0;
        }

        public async Task<bool> Eliminar(int id)
        {
            var entidad = await _db.Movimientos.FindAsync((long)id);
            if (entidad == null) return false;
            _db.Movimientos.Remove(entidad);
            return await _db.SaveChangesAsync() > 0;
        }

        public async Task<Movimiento?> Obtener(int id)
        {
            return await _db.Movimientos
                .Include(m => m.Categoria)
                .FirstOrDefaultAsync(m => m.MovimientoId == id);
        }

        public async Task<List<Movimiento>> ObtenerTodos()
        {
            return await _db.Movimientos
                .Include(m => m.Categoria)
                .AsNoTracking()
                .OrderByDescending(m => m.FechaOperacion)
                .ToListAsync();
        }

        public async Task<decimal> ObtenerTotalPorTipo(char tipo)
        {
            return await _db.Movimientos
                .Where(m => m.Tipo == tipo.ToString())
                .SumAsync(m => (decimal?)m.Monto) ?? 0m;
        }

        public async Task<IEnumerable<(int CategoriaId, string CategoriaNombre, decimal Total)>> ObtenerTotalesPorCategoria(char? tipo = null)
        {
            var q = _db.Movimientos.AsQueryable();

            if (tipo.HasValue)
                q = q.Where(m => m.Tipo == tipo.Value.ToString());

            var grouped = await q
                .GroupBy(m => new { m.CategoriaId, m.Categoria.Nombre })
                .Select(g => new
                {
                    CategoriaId = g.Key.CategoriaId,
                    CategoriaNombre = g.Key.Nombre,
                    Total = g.Sum(x => x.Monto)
                }).ToListAsync();

            return grouped.Select(x => (x.CategoriaId, x.CategoriaNombre, x.Total));
        }

        public async Task<IEnumerable<Movimiento>> ObtenerRecientes(int top = 10)
        {
            return await _db.Movimientos
                .Include(m => m.Categoria)
                .OrderByDescending(m => m.FechaOperacion)
                .ThenByDescending(m => m.CreadoEn)
                .Take(top)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<Movimiento>> ObtenerPorRango(DateTime desde, DateTime hasta)
        {
            return await _db.Movimientos
                .Include(m => m.Categoria)
                .Where(m => m.FechaOperacion >= desde && m.FechaOperacion <= hasta)
                .OrderByDescending(m => m.FechaOperacion)
                .AsNoTracking()
                .ToListAsync();
        }


        ///ACTUALIZACION - FILTRO FECHA


        public async Task<IEnumerable<Movimiento>> ObtenerPorPeriodo(string periodo, DateTime fechaReferencia)
        {
            var query = _db.Movimientos.Include(m => m.Categoria).AsQueryable();

            // Calcular el rango de fechas según el período
            var (fechaInicio, fechaFin) = CalcularRangoFechas(periodo, fechaReferencia);

            return await query
                .Where(m => m.FechaOperacion >= fechaInicio && m.FechaOperacion <= fechaFin)
                .OrderByDescending(m => m.FechaOperacion)
                .ToListAsync();
        }

        public async Task<(DateTime Inicio, DateTime Fin)> ObtenerRangoPeriodo(string periodo, DateTime fechaReferencia)
        {
            return CalcularRangoFechas(periodo, fechaReferencia);
        }

        private (DateTime Inicio, DateTime Fin) CalcularRangoFechas(string periodo, DateTime fechaReferencia)
        {
            DateTime inicio, fin;

            switch (periodo.ToLower())
            {
                case "dia":
                    inicio = fechaReferencia.Date;
                    fin = fechaReferencia.Date.AddDays(1).AddTicks(-1);
                    break;

                case "semana":
                    // Asumiendo que la semana comienza el lunes
                    int diff = (7 + (fechaReferencia.DayOfWeek - DayOfWeek.Monday)) % 7;
                    inicio = fechaReferencia.AddDays(-1 * diff).Date;
                    fin = inicio.AddDays(7).AddTicks(-1);
                    break;

                case "mes":
                    inicio = new DateTime(fechaReferencia.Year, fechaReferencia.Month, 1);
                    fin = inicio.AddMonths(1).AddTicks(-1);
                    break;

                case "año":
                    inicio = new DateTime(fechaReferencia.Year, 1, 1);
                    fin = new DateTime(fechaReferencia.Year + 1, 1, 1).AddTicks(-1);
                    break;

                default:
                    throw new ArgumentException("Período no válido");
            }

            return (inicio, fin);
        }


    }

}