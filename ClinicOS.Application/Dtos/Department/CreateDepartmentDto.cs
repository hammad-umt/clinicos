namespace ClinicOS.Application.Dtos
{
    public class CreateDepartmentDto
    {
        public string Name { get; set; } = string.Empty;
        public int ClinicId { get; set; }
    }
}