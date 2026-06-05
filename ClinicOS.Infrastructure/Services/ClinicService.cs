using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class ClinicService : IClinicService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public ClinicService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ClinicDto> GetAsync()
        {
            var clinic = await _context.Clinics.FirstOrDefaultAsync();
            
            if (clinic == null)
                throw new Exception("Clinic information not found");

            return _mapper.Map<ClinicDto>(clinic);
        }

      public async Task<string> UpdateAsync(UpdateClinicDto dto)
{
    if (string.IsNullOrWhiteSpace(dto.Name))
        throw new ArgumentException("Clinic name is required", nameof(dto.Name));

    // Try to find the existing clinic record
    var clinic = await _context.Clinics.FirstOrDefaultAsync();
    
    bool isNew = false;

    if (clinic == null)
    {
        // Case: No clinic exists, so we create a new one
        clinic = new Clinic();
        _context.Clinics.Add(clinic);
        isNew = true;
    }

    // Update or Initialize properties
    clinic.Name = dto.Name;
    clinic.Logo = dto.Logo ?? clinic.Logo;
    clinic.Address = dto.Address ?? clinic.Address;
    clinic.Phone = dto.Phone ?? clinic.Phone;
    clinic.OpenTime = dto.OpenTime;
    clinic.CloseTime = dto.CloseTime;

    // If it's not new, EF Core tracks the changes, but calling Update is fine
    if (!isNew)
    {
        _context.Clinics.Update(clinic);
    }

    var res = await _context.SaveChangesAsync();

    if (res <= 0)
        throw new Exception("Failed to save clinic information");

    return isNew 
        ? $"Clinic information created successfully: {clinic.Name}" 
        : $"Clinic information updated successfully: {clinic.Name}";
}
    }
}
