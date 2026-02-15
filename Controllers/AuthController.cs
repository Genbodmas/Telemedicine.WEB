using Microsoft.AspNetCore.Mvc;
using Telemedicine.Web.Models.Auth;
using Telemedicine.Web.Utils;

namespace Telemedicine.Web.Controllers
{
    public class AuthController : Controller
    {
        private readonly ApiHelper _apiHelper;

        public AuthController(ApiHelper apiHelper)
        {
            _apiHelper = apiHelper;
        }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var response = await _apiHelper.PostAsync<LoginViewModel, AuthResponse>("api/Auth/login", model);

            if (response != null && !string.IsNullOrEmpty(response.Token))
            {
                Response.Cookies.Append("jwtToken", response.Token, new CookieOptions { HttpOnly = false, Secure = true, SameSite = SameSiteMode.Lax, Expires = DateTime.UtcNow.AddHours(1) });
                Response.Cookies.Append("userName", response.FullName, new CookieOptions { HttpOnly = false });
                Response.Cookies.Append("userId", response.UserId.ToString(), new CookieOptions { HttpOnly = false });
                Response.Cookies.Append("userRole", response.Role, new CookieOptions { HttpOnly = false });

                return RedirectToAction("Index", "Dashboard");
            }

            ModelState.AddModelError("", "Invalid Login Attempt");
            return View(model);
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var registerData = new 
            {
                model.Email,
                model.Password,
                model.FullName,
                model.Role
            };
            
            try 
            {
                 var response = await _apiHelper.PostAsync<object, object>("api/Auth/register", registerData);
                 if (response != null)
                 {
                     return RedirectToAction("Login");
                 }
            }
            catch
            {
                ModelState.AddModelError("", "Registration failed.");
            }
            
            ModelState.AddModelError("", "Registration failed. Please try again.");
            return View(model);
        }

        [HttpGet]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwtToken");
            Response.Cookies.Delete("userName");
            Response.Cookies.Delete("userId");
            Response.Cookies.Delete("userRole");
            return RedirectToAction("Index", "Home");
        }
    }
}
