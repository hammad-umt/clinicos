namespace ClinicOS.Domain.Entities
{
    public class PrescriptionMedicine
    {
        public int Id { get; set; }
        public int PrescriptionId { get; set; }
        public string MedicineName { get; set; }
        public string Dosage { get; set; }
        public string Frequency { get; set; }
        public string Duration { get; set; }

        // Navigation properties
        public virtual Prescription Prescription { get; set; }
    }
}
