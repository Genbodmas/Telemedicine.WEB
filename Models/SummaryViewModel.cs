namespace Telemedicine.Web.Models
{
    public class SummaryViewModel
    {
        public Guid RoomId { get; set; }
        public List<ChatMessageDto> ChatHistory { get; set; } = new List<ChatMessageDto>();
        public List<NoteDto> Notes { get; set; } = new List<NoteDto>();
        public string Recommendation { get; set; }
    }

    public class ChatMessageDto
    {
        public int SenderId { get; set; }
        public string Message { get; set; }
        public string FileUrl { get; set; }
        public DateTime Timestamp { get; set; }
        public string SenderName { get; set; }
    }

    public class NoteDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public string DoctorName { get; set; }
    }
}
