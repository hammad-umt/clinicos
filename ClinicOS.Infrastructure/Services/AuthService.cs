using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IJwtTokenProvider _tokenProvider;
        private readonly UserManager<AppUser> _userManager;

        public AuthService(AppDbContext context, IJwtTokenProvider tokenProvider, UserManager<AppUser> userManager)
        {
            _context = context;
            _tokenProvider = tokenProvider;
            _userManager = userManager;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                throw new Exception("Email and password are required");

            // Find user by email
            var user = await _userManager.FindByEmailAsync(dto.Email);
            
            if (user == null)
                throw new Exception("Invalid email or password");

            // Verify password using UserManager
            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            
            if (!isPasswordValid)
                throw new Exception("Invalid email or password");

            // Load doctor relationship if user is a doctor
            await _context.Entry(user).Reference(u => u.Doctor).LoadAsync();

            // Generate JWT token
            var token = _tokenProvider.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty
            };

            return response;
        }
    }
}

