using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Enums;
using ClinicOS.Domain.Interfaces;
using ClinicOS.Infrastructure.Persistence.Repositories;

namespace ClinicOS.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly TokenRepository _tokenRepository;
        private readonly IGenericRepository<Doctor> _doctorRepository;
        private readonly IGenericRepository<Patient> _patientRepository;
        private readonly IMapper _mapper;

        public TokenService(
            TokenRepository tokenRepository,
            IGenericRepository<Doctor> doctorRepository,
            IGenericRepository<Patient> patientRepository,
            IMapper mapper)
        {
            _tokenRepository = tokenRepository;
            _doctorRepository = doctorRepository;
            _patientRepository = patientRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<TokenDto>> GetTodayTokensAsync(int doctorId)
        {
            var todayTokens =
                await _tokenRepository.GetTodayTokensAsync(doctorId);

            var tokenDtos = todayTokens.Select(t => new TokenDto
            {
                Id = t.Id,
                TokenNumber = t.TokenNumber,
                PatientId = t.PatientId,
                Status = t.Status.ToString(),
                CreatedAt = t.CreatedAt,

                PatientName = t.Patient?.Name ?? "Unknown Patient",
                PatientPhone = t.Patient?.Phone ?? "",

                DoctorId = t.DoctorId,
                DoctorName =
                    t.Doctor?.User?.FullName ??
                    t.Doctor?.Name ??
                    "Unknown Doctor"
            }).ToList();

            foreach (var token in todayTokens)
            {
                Console.WriteLine(
                    $"Patient: {token.Patient?.Name}, " +
                    $"Doctor: {token.Doctor?.Name}"
                );
            }

            return tokenDtos;
        }

        public async Task<TokenDto> CreateAsync(CreateTokenDto dto)
        {
            if (dto.PatientId <= 0 || dto.DoctorId <= 0)
                throw new Exception("Invalid patient or doctor ID");

            var patient =
                await _patientRepository.GetByIdAsync(dto.PatientId);

            if (patient == null)
                throw new Exception(
                    $"Patient with ID {dto.PatientId} not found");

            var doctor =
                await _doctorRepository.GetByIdAsync(dto.DoctorId);

            if (doctor == null)
                throw new Exception(
                    $"Doctor with ID {dto.DoctorId} not found");

            var nextTokenNumber =
                await _tokenRepository.GetNextTokenNumberAsync(dto.DoctorId);

            var token = new Token
            {
                PatientId = dto.PatientId,
                DoctorId = dto.DoctorId,
                TokenNumber = nextTokenNumber,
                Status = TokenStatus.Waiting,
                CreatedAt = DateTime.UtcNow
            };

            await _tokenRepository.AddAsync(token);
            await _tokenRepository.SaveChangesAsync();

            return new TokenDto
            {
                Id = token.Id,
                TokenNumber = token.TokenNumber,
                PatientId = token.PatientId,
                Status = token.Status.ToString(),
                CreatedAt = token.CreatedAt,

                PatientName = patient.Name,
                PatientPhone = patient.Phone,

                DoctorId = token.DoctorId,
                DoctorName = doctor.Name
            };
        }

        public async Task UpdateStatusAsync(int id, TokenStatus status)
        {
            var token =
                await _tokenRepository.GetByIdWithDetailsAsync(id);

            if (token == null)
                throw new Exception("Token not found");

            token.Status = status;

            await _tokenRepository.Update(token);
            await _tokenRepository.SaveChangesAsync();
        }
        public async Task<IEnumerable<TokenDto>> GetAllTokensAsync()
        {
            var tokens = await _tokenRepository.GetAllTokensAsync();

            if (!tokens.Any())
            {
                throw new Exception("No tokens found");
            }

            return tokens.Select(t => new TokenDto
            {
                Id = t.Id,
                TokenNumber = t.TokenNumber,
                PatientId = t.PatientId,

                PatientName = t.Patient?.Name ?? "Unknown Patient",
                PatientPhone = t.Patient?.Phone ?? "",

                DoctorId = t.DoctorId,
                DoctorName =
                    t.Doctor?.User?.FullName ??
                    t.Doctor?.Name ??
                    "Unknown Doctor",

                Status = t.Status.ToString(),
                CreatedAt = t.CreatedAt
            });
        }
    }
}