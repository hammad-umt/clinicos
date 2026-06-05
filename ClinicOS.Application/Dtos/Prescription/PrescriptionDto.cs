namespace ClinicOS.Application.DTOs.Prescription
{
    public class PrescriptionDto
    {
        public int Id { get; set; }
        public int VisitId { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public string Instructions { get; set; }
        public DateTime FollowUpDate { get; set; }
        public DateTime IssuedAt { get; set; }
        public List<PrescriptionMedicineDto> Medicines { get; set; } = new();
    }
}
