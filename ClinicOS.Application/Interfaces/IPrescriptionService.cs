using ClinicOS.Application.DTOs.Prescription;

namespace ClinicOS.Application.Interfaces
{
    public interface IPrescriptionService
    {
        Task<PrescriptionDto?> GetByVisitIdAsync(int visitId);
        Task<PrescriptionDto> CreateAsync(CreatePrescriptionDto dto);
        Task<byte[]> ExportPdfAsync(int prescriptionId);
    }
}
