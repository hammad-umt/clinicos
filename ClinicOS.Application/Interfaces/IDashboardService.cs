using ClinicOS.Application.DTOs.Dashboard;

namespace ClinicOS.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync();
    }
}
