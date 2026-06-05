using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IDoctorService
    {
        Task<IEnumerable<DoctorDto>> GetAllAsync();
        Task<DoctorDto> CreateAsync(CreateDoctorDto dto);
        Task UpdateAsync(int id, CreateDoctorDto dto);
        Task DeleteAsync(int id);
    }
}
