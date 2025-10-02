using EduBank.BLL.Services;
using EduBank.Models;
using EduBank.Models.ViewModel;
using Microsoft.AspNetCore.Mvc;

namespace EduBank.AppWeb.Controllers
{
    public class CategoriaController : Controller
    {
        private readonly ICategoriaService _categoriaService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CategoriaController(ICategoriaService categoriaService, IHttpContextAccessor httpContextAccessor)
        {
            _categoriaService = categoriaService;
            _httpContextAccessor = httpContextAccessor;
        }

        // MÉTODO PARA OBTENER EL USUARIO AUTENTICADO (TEMPORAL - AJUSTAR SEGÚN TU AUTH)
        private int ObtenerUsuarioId()
        {
            // Esto es temporal - debes implementar según tu sistema de autenticación
            // Por ahora retorna 1 como ejemplo
            return 1;

            // Cuando tengas autenticación, sería algo como:
            // var userId = _httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // return int.Parse(userId ?? "0");
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

            var usuarioId = ObtenerUsuarioId();

            var entidad = new Categoria
            {
                Nombre = modelo.Nombre.Trim(),
                Descripcion = modelo.Descripcion,
                Tipo = modelo.Tipo,
                Icono = modelo.Icono,
                Color = modelo.Color,
                Activo = modelo.Activo,
                UsuarioId = usuarioId // ASIGNAR USUARIO ID
            };

            bool resultado;
            if (modelo.CategoriaId == 0)
            {
                resultado = await _categoriaService.Insertar(entidad);
            }
            else
            {
                // Verificar que la categoría pertenezca al usuario
                var categoriaExistente = await _categoriaService.ObtenerPorIdYUsuario(modelo.CategoriaId, usuarioId);
                if (categoriaExistente == null)
                    return BadRequest(new { valor = false, mensaje = "Categoría no encontrada o no autorizada" });

                entidad.CategoriaId = modelo.CategoriaId;
                resultado = await _categoriaService.Actualizar(entidad);
            }

            return Ok(new { valor = resultado });
        }

        [HttpGet]
        public async Task<IActionResult> Lista()
        {
            var usuarioId = ObtenerUsuarioId();
            var lista = await _categoriaService.ObtenerPorUsuario(usuarioId); // FILTRAR POR USUARIO

            var vm = lista.Select(c => new VMCategoria
            {
                CategoriaId = c.CategoriaId,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                Tipo = c.Tipo,
                Icono = c.Icono,
                Color = c.Color,
                Activo = c.Activo,
                UsuarioId = c.UsuarioId
            }).ToList();

            return Ok(vm);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerJson(int id)
        {
            var usuarioId = ObtenerUsuarioId();
            var c = await _categoriaService.ObtenerPorIdYUsuario(id, usuarioId); // FILTRAR POR USUARIO
            if (c == null) return NotFound();

            var vm = new VMCategoria
            {
                CategoriaId = c.CategoriaId,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                Tipo = c.Tipo,
                Icono = c.Icono,
                Color = c.Color,
                Activo = c.Activo,
                UsuarioId = c.UsuarioId
            };
            return Ok(vm);
        }

        [HttpDelete]
        public async Task<IActionResult> Eliminar(int id)
        {
            var usuarioId = ObtenerUsuarioId();
            var categoria = await _categoriaService.ObtenerPorIdYUsuario(id, usuarioId);
            if (categoria == null)
                return NotFound(new { valor = false, mensaje = "Categoría no encontrada o no autorizada" });

            var ok = await _categoriaService.Eliminar(id);
            return Ok(new { valor = ok });
        }

        [HttpPost]
        public async Task<IActionResult> CambiarEstado([FromBody] CambiarEstadoRequest model)
        {
            if (model == null)
                return BadRequest(new { valor = false, mensaje = "Datos inválidos" });

            if (model.CategoriaId <= 0)
                return BadRequest(new { valor = false, mensaje = "ID de categoría inválido" });

            try
            {
                var usuarioId = ObtenerUsuarioId();
                var categoria = await _categoriaService.ObtenerPorIdYUsuario(model.CategoriaId, usuarioId);
                if (categoria == null)
                    return NotFound(new { valor = false, mensaje = "Categoría no encontrada o no autorizada" });

                categoria.Activo = model.Activo;
                var resultado = await _categoriaService.Actualizar(categoria);

                return Ok(new { valor = resultado });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { valor = false, mensaje = "Error interno del servidor" });
            }
        }

        // NUEVO: Endpoint para obtener categorías por tipo
        [HttpGet]
        public async Task<IActionResult> ObtenerPorTipo(string tipo)
        {
            if (string.IsNullOrEmpty(tipo))
                return BadRequest(new { valor = false, mensaje = "Tipo requerido" });

            var usuarioId = ObtenerUsuarioId();
            var lista = await _categoriaService.ObtenerPorUsuarioYTipo(usuarioId, tipo);

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

        public class CambiarEstadoRequest
        {
            public int CategoriaId { get; set; }
            public bool Activo { get; set; }
        }
    }
}
