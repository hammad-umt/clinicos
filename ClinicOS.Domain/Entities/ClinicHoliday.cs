namespace ClinicOS.Domain.Entities
{
    public class ClinicHoliday
    {
        public int Id { get; set; }
        public int ClinicId { get; set; }
        public DateTime Date { get; set; }
        public string Reason { get; set; }

        // Navigation properties
        public virtual Clinic Clinic { get; set; }
    }
}
