namespace Telemedicine.Web.Models
{
    public class DashboardViewModel
    {
        public string Role { get; set; }
        public List<UserDto> Doctors { get; set; } = new List<UserDto>();
        public List<AppointmentDto> Appointments { get; set; } = new List<AppointmentDto>();
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }

    public class AppointmentDto
    {
        public int AppointmentId { get; set; }
        public DateTime ScheduledTime { get; set; }
        public string Status { get; set; }
        public string CounterpartName { get; set; } // Doctor Name or Patient Name
        public Guid? RoomId { get; set; }
    }
}
