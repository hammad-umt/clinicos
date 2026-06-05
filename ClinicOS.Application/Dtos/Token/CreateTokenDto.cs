namespace ClinicOS.Application.Dtos
{
    public class CreateTokenDto
    {
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
    }
}