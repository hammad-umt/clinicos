

using ClinicOS.Application.DTOs.Bill;

namespace ClinicOS.Application.Interfaces
{
    public interface IBillService
    {
        Task<BillDto?> GetByVisitIdAsync(int visitId);
        Task<BillDto?> GetByTokenIdAsync(int tokenId);
        Task<BillDto> CreateAsync(CreateBillDto dto);
        Task<BillDto> CreateFromTokenAsync(int tokenId, int patientId);
        Task<BillDto> UpdateChargesAsync(int id, decimal extraCharges);
        Task MarkAsPaidAsync(int id);
    }
}
