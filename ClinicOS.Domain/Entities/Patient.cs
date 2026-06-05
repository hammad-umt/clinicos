using ClinicOS.Domain.Enums;

namespace ClinicOS.Domain.Entities
{
    public class Patient
    {
        public int Id { get; set; }
        public int Age { get; set; }
        public Gender Gender { get; set; }
        public DateTime RegisteredAt { get; set; }
        
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public string ChronicConditions { get; set; } = string.Empty;
        // Navigation properties
        public virtual ICollection<Token> Tokens { get; set; } = new List<Token>();
        public virtual ICollection<Visit> Visits { get; set; } = new List<Visit>();
    }
}
