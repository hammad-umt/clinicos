using AutoMapper;
using ClinicOS.Application.DTOs.Bill;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ClinicOS.Infrastructure.Services
{
    public class BillService : IBillService
    {
        private readonly BillRepository _billRepository;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public BillService(BillRepository billRepository, AppDbContext context, IMapper mapper)
        {
            _billRepository = billRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<BillDto> CreateAsync(CreateBillDto dto)
        {
            if (dto.VisitId.HasValue && dto.VisitId <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(dto.VisitId));

            decimal consultationFee = 0;

            // If VisitId is provided, get consultation fee from doctor
            if (dto.VisitId.HasValue)
            {
                var visit = await _context.Visits
                    .Include(v => v.Doctor)
                    .FirstOrDefaultAsync(v => v.Id == dto.VisitId);

                if (visit == null)
                    throw new Exception("Visit not found");

                consultationFee = visit.Doctor.ConsultationFee;
            }

            // Calculate total amount
            var totalAmount = (consultationFee + dto.ExtraCharges) - dto.Discount;

            var bill = new Bill
            {
                VisitId = dto.VisitId,
                ConsultationFee = consultationFee,
                ExtraCharges = dto.ExtraCharges,
                Discount = dto.Discount,
                TotalAmount = totalAmount,
                PaymentMethod = dto.PaymentMethod,
                IsPaid = dto.IsPaid,
                CreatedAt = DateTime.UtcNow
            };

            await _billRepository.AddAsync(bill);
            await _billRepository.SaveChangesAsync();

            return _mapper.Map<BillDto>(bill);
        }

        public async Task<BillDto?> GetByVisitIdAsync(int visitId)
        {
            if (visitId <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(visitId));

            var bill = await _billRepository.GetByVisitIdAsync(visitId);
            return bill == null ? null : _mapper.Map<BillDto>(bill);
        }

        public async Task<BillDto?> GetByTokenIdAsync(int tokenId)
        {
            if (tokenId <= 0)
                throw new ArgumentException("Invalid token ID", nameof(tokenId));

            // Find bill linked to token through visit
            var bill = await _context.Bills
                .Include(b => b.Visit)
                .Include(b => b.Visit.Patient)
                .Include(b => b.Visit.Doctor)
                .FirstOrDefaultAsync(b => b.Visit.TokenId == tokenId);

            return bill == null ? null : _mapper.Map<BillDto>(bill);
        }

        public async Task<BillDto> CreateFromTokenAsync(int tokenId, int patientId)
        {
            if (tokenId <= 0)
                throw new ArgumentException("Invalid token ID", nameof(tokenId));

            if (patientId <= 0)
                throw new ArgumentException("Invalid patient ID", nameof(patientId));

            // Verify token exists
            var token = await _context.Tokens
                .FirstOrDefaultAsync(t => t.Id == tokenId && t.PatientId == patientId);

            if (token == null)
                throw new Exception("Token not found for patient");

            // Get doctor's consultation fee
            var doctor = await _context.Doctors
                .FirstOrDefaultAsync(d => d.Id == token.DoctorId);

            if (doctor == null)
                throw new Exception("Doctor not found");

            // Create bill (no visit yet, will be linked after visit is created)
            var bill = new Bill
            {
                TokenId = tokenId,  // Link directly to token
                ConsultationFee = doctor.ConsultationFee,
                ExtraCharges = 0,
                Discount = 0,
                TotalAmount = doctor.ConsultationFee,
                PaymentMethod = 0,
                IsPaid = false,
                CreatedAt = DateTime.UtcNow
            };

            await _billRepository.AddAsync(bill);
            await _billRepository.SaveChangesAsync();

            return _mapper.Map<BillDto>(bill);
        }

        public async Task<BillDto> UpdateChargesAsync(int id, decimal extraCharges)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid bill ID", nameof(id));

            var bill = await _billRepository.GetByIdAsync(id);

            if (bill == null)
                throw new Exception("Bill not found");

            bill.ExtraCharges = extraCharges;
            bill.TotalAmount = bill.ConsultationFee + extraCharges - bill.Discount;

            await _billRepository.Update(bill);
            await _billRepository.SaveChangesAsync();

            // Reload to get navigation properties
            var updatedBill = await _context.Bills
                .Include(b => b.Visit)
                .Include(b => b.Visit.Patient)
                .Include(b => b.Visit.Doctor)
                .FirstOrDefaultAsync(b => b.Id == id);

            return _mapper.Map<BillDto>(updatedBill);
        }

        public async Task MarkAsPaidAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid bill ID", nameof(id));

            var bill = await _billRepository.GetByIdAsync(id);

            if (bill == null)
                throw new Exception("Bill not found");

            bill.IsPaid = true;

            await _billRepository.Update(bill);
            await _billRepository.SaveChangesAsync();
        }
    }
}
