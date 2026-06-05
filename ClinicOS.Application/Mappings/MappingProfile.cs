using AutoMapper;
using ClinicOS.Application.DTOs.Bill;
using ClinicOS.Application.DTOs.Prescription;
using ClinicOS.Application.Dtos;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Enums;

namespace ClinicOS.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // --- Auth Mapping ---
            CreateMap<AppUser, AuthResponseDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            // --- Clinic & Department ---
            CreateMap<Clinic, ClinicDto>().ReverseMap();
            CreateMap<Department, DepartmentDto>().ReverseMap();
            CreateMap<Department, CreateDepartmentDto>().ReverseMap();

            // --- Doctor Mapping ---
            // Mapping for outgoing data: Entity -> DTO
            CreateMap<Doctor, DoctorDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : src.Name))
                .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : string.Empty));

            // Mapping for Auth/Identity User creation
            CreateMap<CreateDoctorDto, AppUser>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => UserRole.Doctor))
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

            // Mapping for Doctor table specific data
CreateMap<CreateDoctorDto, Doctor>()
    .ForMember(dest => dest.DepartmentId, opt => opt.MapFrom(src => src.DepartmentId)) // Add this line
    .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
    .ForMember(dest => dest.UserId, opt => opt.Ignore())
    .ForMember(dest => dest.User, opt => opt.Ignore());

            // --- Patient Mapping ---
            CreateMap<Patient, PatientDto>().ReverseMap();
            CreateMap<CreatePatientDto, Patient>()
                .ForMember(dest => dest.RegisteredAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // --- Token Mapping ---
            CreateMap<Token, TokenDto>()
                .ForMember(dest => dest.PatientId, opt => opt.MapFrom(src => src.PatientId))
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient != null ? src.Patient.Name : string.Empty))
                .ForMember(dest => dest.PatientPhone, opt => opt.MapFrom(src => src.Patient != null ? src.Patient.Phone : string.Empty))
                .ForMember(dest => dest.DoctorId, opt => opt.MapFrom(src => src.DoctorId))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => 
                    src.Doctor != null && src.Doctor.User != null ? src.Doctor.User.FullName : (src.Doctor != null ? src.Doctor.Name : string.Empty)))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreateTokenDto, Token>();

            // --- Visit Mapping ---
            CreateMap<Visit, VisitDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient != null ? src.Patient.Name : string.Empty))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => 
                    src.Doctor != null && src.Doctor.User != null ? src.Doctor.User.FullName : (src.Doctor != null ? src.Doctor.Name : string.Empty)));

            CreateMap<CreateVisitDto, Visit>();

            // --- Prescription Mapping ---
            CreateMap<Prescription, PrescriptionDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Visit != null && src.Visit.Patient != null ? src.Visit.Patient.Name : string.Empty))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => 
                    src.Visit != null && src.Visit.Doctor != null && src.Visit.Doctor.User != null ? src.Visit.Doctor.User.FullName : string.Empty))
                .ForMember(dest => dest.Medicines, opt => opt.MapFrom(src => src.PrescriptionMedicines));

            CreateMap<CreatePrescriptionDto, Prescription>()
                .ForMember(dest => dest.IssuedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<PrescriptionMedicine, PrescriptionMedicineDto>().ReverseMap();
            CreateMap<CreatePrescriptionMedicineDto, PrescriptionMedicine>();

            // --- Bill Mapping ---
            CreateMap<Bill, BillDto>()
                .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Visit != null && src.Visit.Patient != null ? src.Visit.Patient.Name : string.Empty))
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => 
                    src.Visit != null && src.Visit.Doctor != null && src.Visit.Doctor.User != null ? src.Visit.Doctor.User.FullName : string.Empty));

            CreateMap<CreateBillDto, Bill>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.ConsultationFee, opt => opt.Ignore()); 
        }
    }
}