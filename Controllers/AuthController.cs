using Microsoft.AspNetCore.Mvc;
using Telemedicine.Web.Models.Auth;
using Telemedicine.Web.Utils;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;

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

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, response.FullName),
                    new Claim(ClaimTypes.NameIdentifier, response.UserId.ToString()),
                    new Claim(ClaimTypes.Role, response.Role),
                    new Claim("jwt", response.Token) 
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTime.UtcNow.AddMinutes(60)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                return RedirectToAction("Index", "Dashboard");
            }

            ModelState.AddModelError("", "Invalid Login Attempt");
            return View(model);
        }



        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            
            Response.Cookies.Delete("jwtToken");
            Response.Cookies.Delete("userName");
            Response.Cookies.Delete("userId");
            Response.Cookies.Delete("userRole");
            return RedirectToAction("Index", "Home");
        }
    }
}
