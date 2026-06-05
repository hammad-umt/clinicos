namespace ClinicOS.Domain.Entities
{
    public class Clinic
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Logo { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public TimeSpan OpenTime { get; set; }
        public TimeSpan CloseTime { get; set; }

        // Navigation properties
        public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
        public virtual ICollection<ClinicHoliday> Holidays { get; set; } = new List<ClinicHoliday>();
    }
}