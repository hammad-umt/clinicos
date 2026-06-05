using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

public class TokenRepository : GenericRepository<Token>
{
    public TokenRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Token>> GetTodayTokensAsync(int doctorId)
    {
        var today = DateTime.UtcNow.Date;

        return await _dbSet
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
                .ThenInclude(d => d.User)
            .Where(t => t.DoctorId == doctorId && t.CreatedAt.Date == today)
            .OrderBy(t => t.TokenNumber)
            .ToListAsync();
    }

    public async Task<Token?> GetByIdWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
                .ThenInclude(d => d.User)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Token>> GetByDoctorAsync(int doctorId)
    {
        return await _dbSet
            .Include(t => t.Patient)
            .Where(t => t.DoctorId == doctorId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Token>> GetByPatientAsync(int patientId)
    {
        return await _dbSet
            .Include(t => t.Doctor)
                .ThenInclude(d => d.User)
            .Where(t => t.PatientId == patientId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetNextTokenNumberAsync(int doctorId)
    {
        var today = DateTime.UtcNow.Date;

        var lastToken = await _dbSet
            .Where(t => t.DoctorId == doctorId && t.CreatedAt.Date == today)
            .OrderByDescending(t => t.TokenNumber)
            .FirstOrDefaultAsync();

        return (lastToken?.TokenNumber ?? 0) + 1;
    }
}