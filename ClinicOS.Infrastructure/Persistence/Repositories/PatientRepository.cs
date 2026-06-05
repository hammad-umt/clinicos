using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Persistence.Repositories
{
    public class PatientRepository : GenericRepository<Patient>
    {
        public PatientRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Patient?> GetByPhoneAsync(string phone)
        {
            return await _context.Patients
                .FirstOrDefaultAsync(p => p.Phone == phone);
        }

        public async Task<IEnumerable<Patient>> SearchAsync(string searchTerm)
        {
            return await _context.Patients
                .Where(p =>
                    p.Name.Contains(searchTerm) ||
                    p.Phone.Contains(searchTerm))
                .ToListAsync();
        }
        // public async Task SaveChangesAsync()
        // {
        //     await _context.SaveChangesAsync();
        // }
    }
}