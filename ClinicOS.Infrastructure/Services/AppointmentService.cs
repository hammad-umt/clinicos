using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;

namespace ClinicOS.Infrastructure.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IMapper _mapper;

        public AppointmentService(IMapper mapper)
        {
            _mapper = mapper;
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto)
        {
            // TODO: Implement appointment creation with token system
            // Appointments are managed through the Token system
            throw new NotImplementedException("Use TokenService for managing appointments");
        }

        public async Task<IEnumerable<AppointmentDto>> GetAllAsync()
        {
            // TODO: Implement get all appointments
            throw new NotImplementedException();
        }

        public async Task<AppointmentDto?> GetByIdAsync(int id)
        {
            // TODO: Implement get appointment by id
            throw new NotImplementedException();
        }

        public async Task UpdateAsync(int id, CreateAppointmentDto dto)
        {
            // TODO: Implement update appointment
            throw new NotImplementedException();
        }

        public async Task DeleteAsync(int id)
        {
            // TODO: Implement delete appointment
            throw new NotImplementedException();
        }
    }
}
