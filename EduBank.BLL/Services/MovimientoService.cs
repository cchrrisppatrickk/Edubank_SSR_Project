using EduBank.DAL.Repository;
using EduBank.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.BLL.Services
{
    public class MovimientoService : IMovimientoService
    {
        private readonly IMovimientoRepository _repo;
        public MovimientoService(IMovimientoRepository repo) { _repo = repo; }

        public Task<bool> Insertar(Movimiento modelo) => _repo.Insertar(modelo);
        public Task<bool> Actualizar(Movimiento modelo) => _repo.Actualizar(modelo);
        public Task<bool> Eliminar(long id) => _repo.Eliminar((int)id).ContinueWith(t => t.Result); // or change repo signature
        public Task<Movimiento?> Obtener(long id) => _repo.Obtener((int)id);
        public Task<List<Movimiento>> ObtenerTodos() => _repo.ObtenerTodos();
        public Task<decimal> ObtenerTotalPorTipo(char tipo) => _repo.ObtenerTotalPorTipo(tipo);
        public Task<IEnumerable<(int CategoriaId, string CategoriaNombre, decimal Total)>> ObtenerTotalesPorCategoria(char? tipo = null) => _repo.ObtenerTotalesPorCategoria(tipo);
        public Task<IEnumerable<Movimiento>> ObtenerRecientes(int top = 10) => _repo.ObtenerRecientes(top);
        public Task<IEnumerable<Movimiento>> ObtenerPorRango(DateTime desde, DateTime hasta) => _repo.ObtenerPorRango(desde, hasta);


        //NUeva actualización de Filtro de Fechas

        public async Task<IEnumerable<Movimiento>> ObtenerPorPeriodo(string periodo, DateTime fechaReferencia)
        {
            return await _repo.ObtenerPorPeriodo(periodo, fechaReferencia);
        }

        public async Task<(DateTime Inicio, DateTime Fin)> ObtenerRangoPeriodo(string periodo, DateTime fechaReferencia)
        {
            return await _repo.ObtenerRangoPeriodo(periodo, fechaReferencia);
        }
    }
}
