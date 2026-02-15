using Microsoft.AspNetCore.Mvc;
using Telemedicine.Web.Utils;
using Telemedicine.Web.Models;

namespace Telemedicine.Web.Controllers
{
    public class RoomController : Controller
    {
        private readonly ApiHelper _apiHelper;

        public RoomController(ApiHelper apiHelper)
        {
            _apiHelper = apiHelper;
        }

        public IActionResult Index(Guid id)
        {
            if (id == Guid.Empty)
            {
                return RedirectToAction("Index", "Home");
            }
            ViewBag.RoomId = id;
            return View();
        }

        public async Task<IActionResult> Summary(Guid id)
        {
            if (id == Guid.Empty) return RedirectToAction("Index", "Dashboard");

            var model = new SummaryViewModel { RoomId = id };
            var role = Request.Cookies["userRole"];

            // Fetch Chat History
            var chatRes = await _apiHelper.GetAsync<ApiResponse<List<ChatMessageDto>>>($"api/Consultation/history/{id}");
            if (chatRes != null && chatRes.Succeeded)
            {
                model.ChatHistory = chatRes.Data ?? new List<ChatMessageDto>();
            }

 
            var notesRes = await _apiHelper.GetAsync<ApiResponse<List<NoteDto>>>($"api/Consultation/notes/{id}");
            if (notesRes != null && notesRes.Succeeded)
            {
                model.Notes = notesRes.Data ?? new List<NoteDto>();
            }

            // Fetch Recommendation
            var recRes = await _apiHelper.GetAsync<ApiResponse<string>>($"api/Consultation/recommendation/{id}");
            if (recRes != null && recRes.Succeeded)
            {
                model.Recommendation = recRes.Data;
            }

            return View(model);
        }

        public async Task<IActionResult> PreRoom(Guid id)
        {
            ViewBag.RoomId = id;
            var response = await _apiHelper.GetAsync<ApiResponse<RoomDetailsViewModel>>($"api/Consultation/room-details/{id}");
            
            if (response != null && response.Succeeded)
            {
                return View(response.Data);
            }
            return RedirectToAction("Index", "Dashboard");
        }
    }
}
