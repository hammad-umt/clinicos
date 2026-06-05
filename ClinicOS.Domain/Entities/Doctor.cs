using Microsoft.AspNetCore.Identity;

namespace ClinicOS.Domain.Entities
{
    public class Doctor
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public decimal ConsultationFee { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public AppUser User { get; set; } = null!;
        public Department Department { get; set; } = null!;
        public ICollection<Token> Tokens { get; set; } = new List<Token>();
        public ICollection<Visit> Visits { get; set; } = new List<Visit>();
    }
}