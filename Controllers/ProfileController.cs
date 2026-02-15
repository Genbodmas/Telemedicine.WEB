using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telemedicine.Web.Utils; 

namespace Telemedicine.Web.Controllers
{
    [Authorize]
    public class ProfileController : Controller
    {
        private readonly HttpClient _httpClient;

        public ProfileController()
        {
            _httpClient = new HttpClient();
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        [Route("Profile/ProxyImage")]
        public async Task<IActionResult> ProxyImage(string url)
        {
            if (string.IsNullOrEmpty(url)) return NotFound();

            try
            {
                if (!Uri.TryCreate(url, UriKind.Absolute, out var uriResult) || 
                    (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
                {
                    return BadRequest("Invalid URL");
                }

                var imageBytes = await _httpClient.GetByteArrayAsync(url);
                return File(imageBytes, "image/jpeg");
            }
            catch
            {

                return NotFound();
            }
        }
    }
}
