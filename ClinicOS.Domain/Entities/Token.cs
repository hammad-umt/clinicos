using ClinicOS.Domain.Enums;

namespace ClinicOS.Domain.Entities
{
    public class Token
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int TokenNumber { get; set; }
        public TokenStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public Patient Patient { get; set; } = null!;
        public Doctor Doctor { get; set; } = null!;
        public Visit? Visit { get; set; }
    }
}