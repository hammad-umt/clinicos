using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

public class PrescriptionRepository : GenericRepository<Prescription>
{

    public PrescriptionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Prescription?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.Prescriptions
            .Include(p => p.Visit)
                .ThenInclude(v => v.Patient)
            .Include(p => p.Visit)
                .ThenInclude(v => v.Doctor)
                    .ThenInclude(d => d.User)
            .Include(p => p.PrescriptionMedicines)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Prescription?> GetByVisitIdAsync(int visitId)
    {
        return await _context.Prescriptions
            .Include(p => p.Visit)
                .ThenInclude(v => v.Patient)
            .Include(p => p.Visit)
                .ThenInclude(v => v.Doctor)
                    .ThenInclude(d => d.User)
            .Include(p => p.PrescriptionMedicines)
            .FirstOrDefaultAsync(p => p.VisitId == visitId);
    }

    public async Task<IEnumerable<Prescription>> GetPatientPrescriptionsAsync(int patientId)
    {
        return await _context.Prescriptions
            .Include(p => p.Visit)
                .ThenInclude(v => v.Doctor)
                    .ThenInclude(d => d.User)
            .Include(p => p.PrescriptionMedicines)
            .Where(p => p.Visit.PatientId == patientId)
            .OrderByDescending(p => p.IssuedAt)
            .ToListAsync();
    }
}