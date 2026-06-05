using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<DepartmentDto>> GetAllAsync();
        Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto);
        Task DeleteAsync(int id);
    }
}
