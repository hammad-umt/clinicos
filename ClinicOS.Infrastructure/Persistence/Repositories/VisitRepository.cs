using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

public class VisitRepository : GenericRepository<Visit>
{
    public VisitRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Visit?> GetByIdWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
                .ThenInclude(d => d.User)
            .Include(v => v.Token)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<IEnumerable<Visit>> GetPatientHistoryAsync(int patientId)
    {
        return await _dbSet.Include(v=>v.Patient)
            .Include(v => v.Doctor)
                .ThenInclude(d => d.User)
            .Where(v => v.PatientId == patientId)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Visit>> GetDoctorVisitsAsync(int doctorId)
    {
        return await _dbSet
            .Include(v => v.Patient)
            .Where(v => v.DoctorId == doctorId)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync();
    }

    public async Task<Visit?> GetByTokenIdAsync(int tokenId)
    {
        return await _dbSet
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
                .ThenInclude(d => d.User)
            .FirstOrDefaultAsync(v => v.TokenId == tokenId);
    }
}