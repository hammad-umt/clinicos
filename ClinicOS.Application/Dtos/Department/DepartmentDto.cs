namespace ClinicOS.Application.Dtos
{
    public class DepartmentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ClinicId { get; set; }
    }
}