namespace ClinicOS.Application.DTOs.Prescription
{
    public class CreatePrescriptionDto
    {
        public int VisitId { get; set; }
        public string Instructions { get; set; }
        public DateTime FollowUpDate { get; set; }
        public List<CreatePrescriptionMedicineDto> Medicines { get; set; } = new();
    }
}
