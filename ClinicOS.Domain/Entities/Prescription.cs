namespace ClinicOS.Domain.Entities
{
    public class Prescription
    {
        public int Id { get; set; }
        public int VisitId { get; set; }
        public string Instructions { get; set; }
        public DateTime FollowUpDate { get; set; }
        public DateTime IssuedAt { get; set; }

        // Navigation properties
        public virtual Visit Visit { get; set; }
        public virtual ICollection<PrescriptionMedicine> PrescriptionMedicines { get; set; } = new List<PrescriptionMedicine>();
    }
}
