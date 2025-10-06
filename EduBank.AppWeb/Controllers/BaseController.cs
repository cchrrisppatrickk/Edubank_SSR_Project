using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduBank.AppWeb.Controllers
{
    public class BaseController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        protected int ObtenerUsuarioId()
        {
            var userIdClaim = User.FindFirst("UsuarioId");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Usuario no autenticado");
        }

        protected string ObtenerNombreUsuario()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "Usuario";
        }

        protected string ObtenerEmailUsuario()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
        }
    }
}
