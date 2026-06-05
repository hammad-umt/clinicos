using AutoMapper;
using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Interfaces;

namespace ClinicOS.Infrastructure.Services
{
    public class PatientService : IPatientService
    {
        private readonly IGenericRepository<Patient> _patientRepository;
        private readonly IMapper _mapper;

        public PatientService(
            IGenericRepository<Patient> patientRepository,
            IMapper mapper)
        {
            _patientRepository = patientRepository;
            _mapper = mapper;
        }
        public async Task<IEnumerable<PatientDto>> GetAllAsync()
        {
            var patients = await _patientRepository.GetAllAsync();

            return _mapper.Map<IEnumerable<PatientDto>>(patients);
        }
        public async Task<PatientDto> CreateAsync(CreatePatientDto dto)
        {
            var patient = _mapper.Map<Patient>(dto);

            await _patientRepository.AddAsync(patient);
            await _patientRepository.SaveChangesAsync();

            return _mapper.Map<PatientDto>(patient);
        }

        // public async Task<IEnumerable<PatientDto>> GetAllAsync()
        // {
        //     var patients = await _patientRepository.GetAllAsync();

        //     return _mapper.Map<IEnumerable<PatientDto>>(patients);
        // }

        public async Task<PatientDto?> GetByIdAsync(int id)
        {
            var patient = await _patientRepository.GetByIdAsync(id);

            return patient == null
                ? null
                : _mapper.Map<PatientDto>(patient);
        }

        public async Task<IEnumerable<PatientDto>> SearchAsync(SearchPatientDto dto)
        {
            var patients = await _patientRepository.SearchAsync(
                p =>
                    p.Name.Contains(dto.Name ?? "") ||
                    p.Phone.Contains(dto.PhoneNumber ?? "")
            );

            return _mapper.Map<IEnumerable<PatientDto>>(patients);
        }

        public async Task UpdateAsync(int id, CreatePatientDto dto)
        {
            var patient = await _patientRepository.GetByIdAsync(id);

            if (patient == null)
                throw new Exception("Patient not found");

            _mapper.Map(dto, patient);

            await _patientRepository.Update(patient);
            await _patientRepository.SaveChangesAsync();
        }

        
    }
}