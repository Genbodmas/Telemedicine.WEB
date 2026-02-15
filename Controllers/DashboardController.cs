using Microsoft.AspNetCore.Mvc;
using Telemedicine.Web.Models;
using Telemedicine.Web.Utils;

namespace Telemedicine.Web.Controllers
{
    public class DashboardController : Controller
    {
        private readonly ApiHelper _apiHelper;
        private readonly IConfiguration _configuration;

        public DashboardController(ApiHelper apiHelper, IConfiguration configuration)
        {
            _apiHelper = apiHelper;
            _configuration = configuration;
        }

        public async Task<IActionResult> Index()
        {
            var role = Request.Cookies["userRole"];
            var model = new DashboardViewModel { Role = role };

            ViewBag.ApiBaseUrl = _configuration["ApiSettings:BaseUrl"];


            var appointmentResponse = await _apiHelper.GetAsync<ApiResponse<List<AppointmentDto>>>("api/Appointment/my-appointments");
            if (appointmentResponse != null && appointmentResponse.Succeeded)
            {
                model.Appointments = appointmentResponse.Data;
            }


            if (role == "Patient")
            {
                var doctorsResponse = await _apiHelper.GetAsync<ApiResponse<List<UserDto>>>("api/Appointment/doctors");
                if (doctorsResponse != null && doctorsResponse.Succeeded)
                {
                    model.Doctors = doctorsResponse.Data;
                }
            }

            return View(model);
        }

        [HttpGet]
        public IActionResult BookAppointment()
        {
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> BookAppointment(int doctorId, DateTime scheduledTime, string reason)
        {
            var data = new { DoctorId = doctorId, ScheduledTime = scheduledTime, Reason = reason };
            var response = await _apiHelper.PostAsync<object, ApiResponse<int>>("api/Appointment/book", data);
            
            if (response != null && response.Succeeded)
            {
                TempData["Success"] = "Appointment booked successfully!";
                return RedirectToAction("Index");
            }
            
            TempData["Error"] = response?.Message ?? "Failed to book appointment.";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> StartConsultation(int appointmentId)
        {

            var response = await _apiHelper.PostAsync<object, StartConsultationResponse>(
                $"api/Consultation/start/{appointmentId}", new { });

            if (response != null && response.RoomId != Guid.Empty)
            {
                return Redirect($"/Room/PreRoom/{response.RoomId}");
            }

            TempData["Error"] = "Failed to start consultation.";
            return RedirectToAction("Index");
        }
    }

    public class StartConsultationResponse
    {
        public Guid RoomId { get; set; }
        public string Url { get; set; } = "";
    }
}
