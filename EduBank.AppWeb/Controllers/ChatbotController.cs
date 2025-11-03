using Microsoft.AspNetCore.Mvc;

namespace EduBank.AppWeb.Controllers
{
    public class ChatbotController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
