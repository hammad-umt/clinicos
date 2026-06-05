using ClinicOS.Application.Dtos;

namespace ClinicOS.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
    }
}
