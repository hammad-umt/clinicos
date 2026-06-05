using ClinicOS.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace ClinicOS.Domain.Entities
{
    public class AppUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public UserRole Role { get; set; }

        // Navigation Property
        public Doctor? Doctor { get; set; }
    }
}