using ClinicOS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Persistence.Repositories
{
    public class BillRepository : GenericRepository<Bill>
    {
        public BillRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Bill?> GetByIdWithDetailsAsync(int id)
{
    return await _context.Bills
        .Include(b => b.Visit)
            .ThenInclude(v => v.Patient)
        .Include(b => b.Visit)
            .ThenInclude(v => v.Doctor)
                .ThenInclude(d => d.User)
        .FirstOrDefaultAsync(b => b.Id == id);
}

        public async Task<Bill?> GetByVisitIdAsync(int visitId)
        {
            return await _context.Bills
                .Include(b => b.Visit)
                    .ThenInclude(v => v.Patient)
                .Include(b => b.Visit)
                    .ThenInclude(v => v.Doctor)
                        .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(b => b.VisitId == visitId);
        }

       public async Task<IEnumerable<Bill>> GetPatientBillsAsync(int patientId)
{
    return await _context.Bills
        .Include(b => b.Visit)
            .ThenInclude(v => v.Patient)   
        .Include(b => b.Visit)
            .ThenInclude(v => v.Doctor)
                .ThenInclude(d => d.User)
        .Where(b => b.Visit.PatientId == patientId)
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();
}
        public async Task<IEnumerable<Bill>> GetUnpaidBillsAsync()
        {
            return await _context.Bills
                .Include(b => b.Visit)
                    .ThenInclude(v => v.Patient)
                .Where(b => !b.IsPaid)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<decimal> GetTodayRevenueAsync()
        {
            return await _context.Bills
                .Where(b =>
                    b.CreatedAt.Date == DateTime.UtcNow.Date &&
                    b.IsPaid)
                .SumAsync(b => b.TotalAmount);
        }
    }
}