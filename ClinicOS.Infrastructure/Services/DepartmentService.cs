using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public DepartmentService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<DepartmentDto>> GetAllAsync()
        {
            var departments = await _context.Departments
                .Include(d => d.Clinic)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DepartmentDto>>(departments);
        }

        public async Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Department name is required", nameof(dto.Name));

            if (dto.ClinicId <= 0)
                throw new ArgumentException("Invalid clinic ID", nameof(dto.ClinicId));

            // Verify clinic exists
            var clinicExists = await _context.Clinics.AnyAsync(c => c.Id == dto.ClinicId);
            if (!clinicExists)
                throw new Exception("Clinic not found");

            var department = new Department
            {
                Name = dto.Name,
                ClinicId = dto.ClinicId
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return _mapper.Map<DepartmentDto>(department);
        }

        public async Task DeleteAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid department ID", nameof(id));

            var department = await _context.Departments.FindAsync(id);
            
            if (department == null)
                throw new Exception("Department not found");

            // Check if department has doctors
            var doctorCount = await _context.Doctors
                .Where(d => d.DepartmentId == id)
                .CountAsync();

            if (doctorCount > 0)
                throw new Exception("Cannot delete department with assigned doctors");

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
        }
    }
}
