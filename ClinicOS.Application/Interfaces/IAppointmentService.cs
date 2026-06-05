using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IAppointmentService
    {
        Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto);
        Task<IEnumerable<AppointmentDto>> GetAllAsync();
        Task<AppointmentDto?> GetByIdAsync(int id);
        Task UpdateAsync(int id, CreateAppointmentDto dto);
        Task DeleteAsync(int id);
    }
}
