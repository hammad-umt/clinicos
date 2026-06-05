namespace ClinicOS.Domain.Entities
{
    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int ClinicId { get; set; }

        // Navigation properties
        public virtual Clinic Clinic { get; set; }
        public virtual ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    }
}
