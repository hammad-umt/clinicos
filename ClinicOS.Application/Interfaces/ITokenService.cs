using ClinicOS.Application.Dtos;
using ClinicOS.Domain.Enums;

namespace ClinicOS.Application.Interfaces
{
    public interface ITokenService
    {
        Task<IEnumerable<TokenDto>> GetTodayTokensAsync(int doctorId);
        Task<TokenDto> CreateAsync(CreateTokenDto dto);
        Task UpdateStatusAsync(int id, TokenStatus status);
    }
}
