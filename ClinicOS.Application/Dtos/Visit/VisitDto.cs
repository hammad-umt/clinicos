 namespace ClinicOS.Application.Dtos
 {
    public class VisitDto
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string ChiefComplaint { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public DateTime VisitDate { get; set; }
    }
    
 }