using EduBank.DAL.DataContext;
using EduBank.Models;
using EduBank.Models.ViewModel;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;

namespace EduBank.AppWeb.Controllers
{
    public class AccesoController : Controller
    {
        private readonly EdubanckssrContext _db;

        public AccesoController(EdubanckssrContext context)
        {
            _db = context;
        }

        [HttpGet]
        public IActionResult Registrarse()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Registrarse(RegistroViewModel model)
        {
            if (model.Contrasena != model.ConfirmarContrasena)
            {
                ViewData["Mensaje"] = "Las contraseñas no coinciden";
                return View();
            }

            Usuario usuario = new Usuario()
            {
                Nombre = model.Nombre,
                Apellidos = model.Apellidos,
                CorreoElectronico = model.CorreoElectronico,
                Contrasena = model.Contrasena,
            };

            await _db.Usuarios.AddAsync(usuario);
            await _db.SaveChangesAsync();

            if (usuario.UsuarioId != 0) return RedirectToAction("Login", "Acceso");

            ViewData["Mensaje"] = "No se puede crear un nuevo usuario, error fatal";
            return View();
        }


        [HttpGet]
        public IActionResult Login()
        {
            if (User.Identity.IsAuthenticated)
                return RedirectToAction("Index", "Home");

            return View();
        }




        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel modelo)
        {
            Usuario? usuario_encontrado = await _db.Usuarios
                .Where(u =>
                    u.CorreoElectronico == modelo.CorreoElectronico &&
                    u.Contrasena == modelo.Contrasena)
                .FirstOrDefaultAsync();

            if (usuario_encontrado == null)
            {
                ViewData["Mensaje"] = "No se encontraron coincidencias";
                return View();
            }


            List<Claim> claims = new List<Claim>()
            {
                new Claim(ClaimTypes.Name, usuario_encontrado.Nombre)
            };

            ClaimsIdentity claimsIdentity = new ClaimsIdentity(claims,CookieAuthenticationDefaults.AuthenticationScheme);

            AuthenticationProperties properties = new AuthenticationProperties()
            {
                AllowRefresh = true,
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                properties
            );


            return RedirectToAction("Index", "Home");
        }
    }
}