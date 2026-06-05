namespace ClinicOS.Domain.Entities
{
    public class Visit
    {
        
        public int Id { get; set; }
        public int TokenId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public DateTime VisitDate { get; set; }
        public string ChiefComplaint { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public Token Token { get; set; } = null!;
        public Patient Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public Prescription? Prescription { get; set; }
        public Bill? Bill { get; set; }
        }
}
