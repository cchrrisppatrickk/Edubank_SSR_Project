    using EduBank.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EduBank.BLL.Services
{
    public interface ICategoriaService
    {
        Task<bool> Insertar(Categoria modelo);
        Task<bool> Actualizar(Categoria modelo);
        Task<bool> Eliminar(int id);
        Task<Categoria?> Obtener(int id);
        Task<List<Categoria>> ObtenerTodos();

        // Nuevos métodos
        Task<Categoria?> ObtenerPorIdYUsuario(int id, int usuarioId);
        Task<List<Categoria>> ObtenerPorUsuario(int usuarioId);
        Task<List<Categoria>> ObtenerPorUsuarioYTipo(int usuarioId, string tipo);
    }
}
