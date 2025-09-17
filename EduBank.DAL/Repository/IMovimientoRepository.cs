using EduBank.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.DAL.Repository
{
    public interface IMovimientoRepository : IGenericRepository<Movimiento>
    {
        Task<decimal> ObtenerTotalPorTipo(char tipo); // 'I' o 'G'
        Task<IEnumerable<(int CategoriaId, string CategoriaNombre, decimal Total)>> ObtenerTotalesPorCategoria(char? tipo = null);
        Task<IEnumerable<Movimiento>> ObtenerRecientes(int top = 10);
        Task<IEnumerable<Movimiento>> ObtenerPorRango(DateTime desde, DateTime hasta);


        ///ACTUALIZACION - FILTRO FECHA

        Task<IEnumerable<Movimiento>> ObtenerPorPeriodo(string periodo, DateTime fechaReferencia);
        Task<(DateTime Inicio, DateTime Fin)> ObtenerRangoPeriodo(string periodo, DateTime fechaReferencia);



    }
}
