using ClinicOS.Domain.Enums;

namespace ClinicOS.Application.Dtos
{
    public class PatientDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public int Age { get; set; }
        public Gender Gender { get; set; } = Gender.Male;
        public string Address { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public string ChronicConditions { get; set; } = string.Empty;
        public DateTime RegisteredAt { get; set; }

    
}
}