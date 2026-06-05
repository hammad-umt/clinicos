using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IClinicService
    {
        Task<ClinicDto> GetAsync();
        Task<string> UpdateAsync(UpdateClinicDto dto);
    }
}
