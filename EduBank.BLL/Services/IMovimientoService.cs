using EduBank.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.BLL.Services
{
    public interface IMovimientoService
    {
        Task<bool> Insertar(Movimiento modelo);
        Task<bool> Actualizar(Movimiento modelo);
        Task<bool> Eliminar(long id);
        Task<Movimiento?> Obtener(long id);
        Task<List<Movimiento>> ObtenerTodos();
        Task<decimal> ObtenerTotalPorTipo(char tipo);
        Task<IEnumerable<(int CategoriaId, string CategoriaNombre, decimal Total)>> ObtenerTotalesPorCategoria(char? tipo = null);
        Task<IEnumerable<Movimiento>> ObtenerRecientes(int top = 10);
        Task<IEnumerable<Movimiento>> ObtenerPorRango(DateTime desde, DateTime hasta);

        // Nuevos métodos para filtrar por período

        Task<IEnumerable<Movimiento>> ObtenerPorPeriodo(string periodo, DateTime fechaReferencia);
        Task<(DateTime Inicio, DateTime Fin)> ObtenerRangoPeriodo(string periodo, DateTime fechaReferencia);



    }
}
