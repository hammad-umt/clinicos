using ClinicOS.Domain.Enums;

namespace ClinicOS.Application.DTOs.Bill
{
    public class CreateBillDto
    {
        public int? VisitId { get; set; }
        public decimal ExtraCharges { get; set; }
        public decimal Discount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public bool IsPaid { get; set; }
    }
}
