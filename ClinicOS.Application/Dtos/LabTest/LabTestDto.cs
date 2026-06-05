namespace ClinicOS.Application.Dtos
{
    public class LabTestDto
    {
        public int Id { get; set; }
        public int VisitId { get; set; }
        public string TestName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
