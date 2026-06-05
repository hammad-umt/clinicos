using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IPatientService
    {
        Task<IEnumerable<PatientDto>> GetAllAsync();
        Task<IEnumerable<PatientDto>> SearchAsync(SearchPatientDto dto);
        Task<PatientDto> GetByIdAsync(int id);
        Task<PatientDto> CreateAsync(CreatePatientDto dto);
        Task UpdateAsync(int id, CreatePatientDto dto);
    }
}
