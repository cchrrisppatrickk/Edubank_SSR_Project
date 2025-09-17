using EduBank.BLL.Services;
using EduBank.Models;
using EduBank.Models.ViewModel;
using Microsoft.AspNetCore.Mvc;

namespace EduBank.AppWeb.Controllers
{
    public class CategoriaController : Controller
    {
        private readonly ICategoriaService _categoriaService;

        public CategoriaController(ICategoriaService categoriaService)
        {
            _categoriaService = categoriaService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Insertar([FromBody] VMCategoria modelo)
        {
            if (modelo == null) return BadRequest(new { valor = false, mensaje = "Datos inválidos" });
            if (string.IsNullOrWhiteSpace(modelo.Nombre))
                return BadRequest(new { valor = false, mensaje = "Nombre requerido" });

            var entidad = new Categoria
            {
                Nombre = modelo.Nombre.Trim(),
                Descripcion = modelo.Descripcion,
                Tipo = modelo.Tipo,
                Icono = modelo.Icono,
                Color = modelo.Color,
                Activo = modelo.Activo
            };

            bool resultado;
            if (modelo.CategoriaId == 0)
            {
                resultado = await _categoriaService.Insertar(entidad);
            }
            else
            {
                entidad.CategoriaId = modelo.CategoriaId;
                resultado = await _categoriaService.Actualizar(entidad);
            }

            return Ok(new { valor = resultado });
        }

        [HttpGet]
        public async Task<IActionResult> Lista()
        {
            var lista = await _categoriaService.ObtenerTodos();
            var vm = lista.Select(c => new VMCategoria
            {
                CategoriaId = c.CategoriaId,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                Tipo = c.Tipo,
                Icono = c.Icono,
                Color = c.Color,
                Activo = c.Activo
            }).ToList();

            return Ok(vm);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerJson(int id)
        {
            var c = await _categoriaService.Obtener(id);
            if (c == null) return NotFound();
            var vm = new VMCategoria
            {
                CategoriaId = c.CategoriaId,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                Tipo = c.Tipo,
                Icono = c.Icono,
                Color = c.Color,
                Activo = c.Activo
            };
            return Ok(vm);
        }

        [HttpDelete]
        public async Task<IActionResult> Eliminar(int id)
        {
            var ok = await _categoriaService.Eliminar(id);
            return Ok(new { valor = ok });
        }

        [HttpPost]
        public async Task<IActionResult> CambiarEstado([FromBody] dynamic model)
        {
            // Model expected: { CategoriaId: int, Activo: bool }
            try
            {
                int id = (int)model.CategoriaId;
                bool activo = (bool)model.Activo;
                var c = await _categoriaService.Obtener(id);
                if (c == null) return NotFound(new { valor = false, mensaje = "No encontrada" });

                c.Activo = activo;
                var ok = await _categoriaService.Actualizar(c);
                return Ok(new { valor = ok });
            }
            catch
            {
                return BadRequest(new { valor = false, mensaje = "Datos inválidos" });
            }
        }
    }
}
