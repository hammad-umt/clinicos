namespace ClinicOS.Domain.Entities
{
    public class LabTest
    {
        public int Id { get; set; }
        public int VisitId { get; set; }
        public string TestName { get; set; }
        public string Notes { get; set; }

        // Navigation properties
        public virtual Visit Visit { get; set; }
    }
}
