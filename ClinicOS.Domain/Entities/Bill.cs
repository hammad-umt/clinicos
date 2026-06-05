using ClinicOS.Domain.Enums;

namespace ClinicOS.Domain.Entities
{
    public class Bill
    {
        public int Id { get; set; }
        public int? TokenId { get; set; }
        public int? VisitId { get; set; }
        public decimal ConsultationFee { get; set; }
        public decimal ExtraCharges { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public bool IsPaid { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Visit? Visit { get; set; }
    }
}
