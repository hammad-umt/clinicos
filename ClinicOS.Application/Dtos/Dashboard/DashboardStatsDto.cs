namespace ClinicOS.Application.DTOs.Dashboard
{
    public class DashboardStatsDto
    {
        public int TodayPatients { get; set; }
        public decimal TodayRevenue { get; set; }
        public int TotalPatients { get; set; }
        public int TotalDoctors { get; set; }
        public int PendingTokens { get; set; }
    }
}
