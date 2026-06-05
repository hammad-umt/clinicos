using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Enums;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class VisitService : IVisitService
    {
        private readonly VisitRepository _visitRepository;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public VisitService(
            VisitRepository visitRepository,
            AppDbContext context,
            IMapper mapper)
        {
            _visitRepository = visitRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<VisitDto> GetByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(id));

            var visit =
                await _visitRepository.GetByIdWithDetailsAsync(id);

            if (visit == null)
                throw new Exception("Visit not found");

            return _mapper.Map<VisitDto>(visit);
        }

        public async Task<IEnumerable<VisitDto>> GetPatientHistoryAsync(int patientId)
        {
            if (patientId <= 0)
                throw new ArgumentException("Invalid patient ID", nameof(patientId));

            var visits =
                await _visitRepository.GetPatientHistoryAsync(patientId);

            return _mapper.Map<IEnumerable<VisitDto>>(visits);
        }

        public async Task<VisitDto> CreateAsync(CreateVisitDto dto)
        {
            if (dto.PatientId <= 0)
                throw new ArgumentException("Invalid patient ID", nameof(dto.PatientId));

            if (dto.DoctorId <= 0)
                throw new ArgumentException("Invalid doctor ID", nameof(dto.DoctorId));

            if (dto.TokenId <= 0)
                throw new ArgumentException("Invalid token ID", nameof(dto.TokenId));

            var patientExists =
                await _context.Patients.AnyAsync(p => p.Id == dto.PatientId);

            if (!patientExists)
                throw new Exception("Patient not found");

            var doctorExists =
                await _context.Doctors.AnyAsync(d => d.Id == dto.DoctorId);

            if (!doctorExists)
                throw new Exception("Doctor not found");

            var token =
                await _context.Tokens.FirstOrDefaultAsync(t =>
                    t.Id == dto.TokenId &&
                    t.PatientId == dto.PatientId &&
                    t.DoctorId == dto.DoctorId);

            if (token == null)
                throw new Exception("Invalid token for this patient and doctor");

            var visit = new Visit
            {
                PatientId = dto.PatientId,
                DoctorId = dto.DoctorId,
                TokenId = dto.TokenId,
                VisitDate = DateTime.UtcNow,
                ChiefComplaint = dto.ChiefComplaint,
                Diagnosis = dto.Diagnosis
            };

            _context.Visits.Add(visit);
            await _context.SaveChangesAsync();

            token.Status = TokenStatus.Done;
            _context.Tokens.Update(token);
            await _context.SaveChangesAsync();

            // IMPORTANT FIX: reload with navigation properties
            var createdVisit =
                await _visitRepository.GetByIdWithDetailsAsync(visit.Id);

            return _mapper.Map<VisitDto>(createdVisit);
        }

        public async Task<VisitDto> UpdateAsync(int id, CreateVisitDto dto)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(id));

            var visit = await _visitRepository.GetByIdWithDetailsAsync(id);

            if (visit == null)
                throw new Exception("Visit not found");

            if (!string.IsNullOrEmpty(dto.Diagnosis))
                visit.Diagnosis = dto.Diagnosis;

            if (!string.IsNullOrEmpty(dto.ChiefComplaint))
                visit.ChiefComplaint = dto.ChiefComplaint;

            // Notes field maps to diagnosis in visit (based on contract)
            // However, keeping diagnosis separate for clarity
            
            _context.Visits.Update(visit);
            await _context.SaveChangesAsync();

            // Reload with details
            var updatedVisit = await _visitRepository.GetByIdWithDetailsAsync(id);
            return _mapper.Map<VisitDto>(updatedVisit);
        }
    }
}