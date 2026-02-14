using System;

namespace Telemedicine.Web.Models
{
    public class RoomDetailsViewModel
    {
        public Guid RoomId { get; set; }
        public int AppointmentId { get; set; }
        public DateTime ScheduledTime { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
    }
}
