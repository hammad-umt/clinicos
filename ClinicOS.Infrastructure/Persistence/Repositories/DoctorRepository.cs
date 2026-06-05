using ClinicOS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Persistence.Repositories
{
    public class DoctorRepository : GenericRepository<Doctor>
    {
        public DoctorRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Doctor?> GetDoctorByNameAsync(string name)
        {
            return await _context.Doctors
                .FirstOrDefaultAsync(d => d.Name == name);
        }
        public async Task<IEnumerable<Doctor>> GetAllDoctorsAsync()
        {
            return await _context.Doctors
            .Include(d => d.Department)
            .Include(d => d.User)
            .ToListAsync();
        }
        public async Task<IEnumerable<Doctor>> GetDoctorsByDepartmentAsync(int departmentId)
        {
             return await _context.Doctors
        .Include(d => d.Department)
        .Include(d => d.User)
        .Where(d => d.DepartmentId == departmentId)
        .ToListAsync();
        }

        public async Task<IEnumerable<Doctor>> GetActiveDoctorsAsync()
        {
            return await _context.Doctors
                .Where(d => d.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<Doctor>> GetDoctorsWithSpecializationAsync(string specialization)
        {
            return await _context.Doctors
                .Where(d => d.Specialization == specialization)
                .ToListAsync();
        }
    }
}