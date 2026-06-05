namespace ClinicOS.Application.Dtos
{
    public class CreateVisitDto
    {
        public int TokenId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public string ChiefComplaint { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
    }
    
}