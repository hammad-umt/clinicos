using ClinicOS.Domain.Enums;

namespace ClinicOS.Application.DTOs.Bill
{
    public class BillDto
    {
        public int Id { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public decimal ConsultationFee { get; set; }
        public decimal ExtraCharges { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public bool IsPaid { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
