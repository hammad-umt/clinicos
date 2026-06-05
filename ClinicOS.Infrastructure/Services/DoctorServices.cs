using AutoMapper;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Enums;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Identity;

public class DoctorService : IDoctorService
{
    private readonly DoctorRepository _doctorRepository;
    private readonly IMapper _mapper;
    private readonly UserManager<AppUser> _userManager;

    public DoctorService(DoctorRepository doctorRepository, IMapper mapper, UserManager<AppUser> userManager)
    {
        _doctorRepository = doctorRepository;
        _mapper = mapper;
        _userManager = userManager;
    }

    public async Task<DoctorDto> CreateAsync(CreateDoctorDto dto)
    {
        // 1. Map and Create the AppUser (Identity)
        var user = _mapper.Map<AppUser>(dto);

        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new Exception($"Failed to create user: {errors}");
        }

        var roleResult = await _userManager.AddToRoleAsync(user, UserRole.Doctor.ToString());
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new Exception($"Doctor user created, but role assignment failed: {errors}");
        }

        // 2. Map CreateDoctorDto to Doctor Entity
        var doctor = _mapper.Map<Doctor>(dto);
        
        // Manual assignment to ensure foreign keys are correctly linked
        doctor.UserId = user.Id;
        doctor.DepartmentId = dto.DepartmentId; 
        doctor.User = user;

        // 3. Save to Doctor Table
        await _doctorRepository.AddAsync(doctor);
        await _doctorRepository.SaveChangesAsync();

        return _mapper.Map<DoctorDto>(doctor);
    }

    public async Task DeleteAsync(int id)
    {
        // Retrieve doctor with the User included
        var doctor = await _doctorRepository.GetByIdAsync(id);

        if (doctor == null)
            throw new Exception("Doctor not found");

        var userId = doctor.UserId;

        // 1. Remove from Doctor table first
        await _doctorRepository.Delete(doctor);
        await _doctorRepository.SaveChangesAsync();

        // 2. Remove from AspNetUsers table via UserManager
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                throw new Exception("Doctor record removed, but identity user could not be deleted.");
            }
        }
    }

    public async Task<IEnumerable<DoctorDto>> GetAllAsync()
    {
        var doctors = await _doctorRepository.GetAllDoctorsAsync();
        return doctors.Select(d => _mapper.Map<DoctorDto>(d));
    }

public async Task UpdateAsync(int id, CreateDoctorDto dto)
{
    // 1. Fetch doctor including the User navigation property
    var doctor = await _doctorRepository.GetByIdAsync(id);

    if (doctor == null)
        throw new Exception("Doctor not found");

    // 2. Update the Doctor entity properties
    _mapper.Map(dto, doctor);
    doctor.DepartmentId = dto.DepartmentId; // Ensure FK is updated

    // 3. Sync changes to the AppUser (Identity table)
    if (doctor.User != null)
    {
        doctor.User.FullName = dto.Name;
        doctor.User.Email = dto.Email;
        doctor.User.UserName = dto.Email; // Usually UserName matches Email
        var userUpdateResult = await _userManager.UpdateAsync(doctor.User);
        if (!userUpdateResult.Succeeded)
        {
            var errors = string.Join("; ", userUpdateResult.Errors.Select(e => e.Description));
            throw new Exception($"Failed to update associated user: {errors}");
        }
    }
    // 4. Save professional profile changes
    await _doctorRepository.Update(doctor);
    await _doctorRepository.SaveChangesAsync();
}
    public async Task<DoctorDto?> GetByIdAsync(int id)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id);
        return doctor == null ? null : _mapper.Map<DoctorDto>(doctor);
    }

    public async Task<DoctorDto?> GetByNameAsync(string name)
    {
        var doctor = await _doctorRepository.GetDoctorByNameAsync(name);
        return doctor == null ? null : _mapper.Map<DoctorDto>(doctor);
    }

    public async Task<IEnumerable<DoctorDto>> GetByDepartmentIdAsync(int departmentId)
    {
        var doctors = await _doctorRepository.GetDoctorsByDepartmentAsync(departmentId);
        return doctors.Select(d => _mapper.Map<DoctorDto>(d));
    }

    public async Task<IEnumerable<DoctorDto>> GetActiveDoctorsAsync()
    {
        var doctors = await _doctorRepository.GetActiveDoctorsAsync();
        return doctors.Select(d => _mapper.Map<DoctorDto>(d));
    }
}