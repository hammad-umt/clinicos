using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IVisitService
    {
        Task<VisitDto> GetByIdAsync(int id);
        Task<IEnumerable<VisitDto>> GetPatientHistoryAsync(int patientId);
        Task<VisitDto> CreateAsync(CreateVisitDto dto);
        Task<VisitDto> UpdateAsync(int id, CreateVisitDto dto);
    }
}
