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
                throw;
            }
        }

        public async Task<bool> Actualizar(Categoria modelo)
        {
            try
            {
                // Buscar la entidad sin rastreo para evitar conflictos
                var entidadExistente = await _db.Categorias
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CategoriaId == modelo.CategoriaId);

                if (entidadExistente == null)
                    return false;

                // Adjuntar y marcar como modificado
                _db.Categorias.Attach(modelo);
                _db.Entry(modelo).State = EntityState.Modified;

                var affected = await _db.SaveChangesAsync();
                return affected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al actualizar categoría: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> Eliminar(int id)
        {
            var entidad = await _db.Categorias.FindAsync(id);
            if (entidad == null) return false;

            // Soft delete en lugar de eliminar físicamente
            entidad.Activo = false;
            var affected = await _db.SaveChangesAsync();
            return affected > 0;
        }

        public async Task<Categoria?> Obtener(int id)
        {
            return await _db.Categorias
                .FirstOrDefaultAsync(c => c.CategoriaId == id && c.Activo);
        }

        // NUEVO: Obtener categoría por ID y Usuario
        public async Task<Categoria?> ObtenerPorIdYUsuario(int id, int usuarioId)
        {
            return await _db.Categorias
                .FirstOrDefaultAsync(c => c.CategoriaId == id && c.UsuarioId == usuarioId && c.Activo);
        }

        public async Task<List<Categoria>> ObtenerTodos()
        {
            return await _db.Categorias
                .Where(c => c.Activo)
                .AsNoTracking()
                .ToListAsync();
        }

        // NUEVO: Obtener categorías por usuario específico
        public async Task<List<Categoria>> ObtenerPorUsuario(int usuarioId)
        {
            return await _db.Categorias
                .Where(c => c.UsuarioId == usuarioId && c.Activo)
                .AsNoTracking()
                .ToListAsync();
        }

  
    }
}
