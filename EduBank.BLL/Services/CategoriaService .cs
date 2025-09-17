using EduBank.DAL.Repository;
using EduBank.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.BLL.Services
{

    public class CategoriaService : ICategoriaService
    {
        private readonly IGenericRepository<Categoria> _repo;

        public CategoriaService(IGenericRepository<Categoria> repo)
        {
            _repo = repo;
        }

        public Task<bool> Insertar(Categoria modelo) => _repo.Insertar(modelo);
        public Task<bool> Actualizar(Categoria modelo) => _repo.Actualizar(modelo);
        public Task<bool> Eliminar(int id) => _repo.Eliminar(id);
        public Task<Categoria?> Obtener(int id) => _repo.Obtener(id);
        public Task<List<Categoria>> ObtenerTodos() => _repo.ObtenerTodos();
    }
}
