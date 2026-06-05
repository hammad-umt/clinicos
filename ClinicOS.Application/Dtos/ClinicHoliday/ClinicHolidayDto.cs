namespace ClinicOS.Application.DTOs.ClinicHoliday
{
    public class ClinicHolidayDto
    {
        public int Id { get; set; }
        public int ClinicId { get; set; }
        public DateTime Date { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
