namespace ClinicOS.Application.Dtos
{
    public class CreateLabTestDto
    {
        public int VisitId { get; set; }
        public string TestName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }
}
