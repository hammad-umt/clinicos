using ClinicOS.Application.DTOs.Dashboard;
using ClinicOS.Application.Interfaces;
using ClinicOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetStatsAsync()
        {
            var today = DateTime.Today;

            // Get today's visits
            var todayVisits = await _context.Visits
                .Where(v => v.VisitDate.Date == today)
                .ToListAsync();

            // Get today's bills
            var todayBills = await _context.Bills
                .Where(b => b.CreatedAt.Date == today)
                .ToListAsync();

            // Get total patients
            var totalPatients = await _context.Patients
                .CountAsync();

            // Get total doctors
            var totalDoctors = await _context.Doctors
                .CountAsync();

            // Get pending tokens (not completed yet)
            var pendingTokens = await _context.Tokens
                .Where(t => t.Status == ClinicOS.Domain.Enums.TokenStatus.Waiting)
                .CountAsync();

            // Calculate today's revenue
            var todayRevenue = todayBills.Sum(b => b.TotalAmount);

            var stats = new DashboardStatsDto
            {
                TodayPatients = todayVisits.Count,
                TodayRevenue = todayRevenue,
                TotalPatients = totalPatients,
                TotalDoctors = totalDoctors,
                PendingTokens = pendingTokens
            };

            return stats;
        }
    }
}
