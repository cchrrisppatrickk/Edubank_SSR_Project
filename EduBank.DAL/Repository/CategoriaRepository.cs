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
    public class CategoriaRepository : IGenericRepository<Categoria>
    {
        private readonly EdubanckssrContext _db;

        public CategoriaRepository(EdubanckssrContext context)
        {
            _db = context;
        }

        public async Task<bool> Insertar(Categoria modelo)
        {
            try
            {
                await _db.Categorias.AddAsync(modelo);
                var affected = await _db.SaveChangesAsync();
                return affected > 0;
            }
            catch (Exception)
            {
                // logear excepción aquí con ILogger
                throw;
            }
        }

        public async Task<bool> Actualizar(Categoria modelo)
        {
            _db.Categorias.Update(modelo);
            var affected = await _db.SaveChangesAsync();
            return affected > 0;
        }

        public async Task<bool> Eliminar(int id)
        {
            var entidad = await _db.Categorias.FindAsync(id);
            if (entidad == null) return false;
            _db.Categorias.Remove(entidad);
            var affected = await _db.SaveChangesAsync();
            return affected > 0;
        }

        public async Task<Categoria?> Obtener(int id)
        {
            return await _db.Categorias
                .FirstOrDefaultAsync(c => c.CategoriaId == id);
        }

        public async Task<List<Categoria>> ObtenerTodos()
        {
            return await _db.Categorias
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
