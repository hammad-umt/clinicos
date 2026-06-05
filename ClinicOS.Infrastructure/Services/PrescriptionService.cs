using AutoMapper;
using ClinicOS.Application.DTOs.Prescription;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Infrastructure.Persistence.Repositories;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ClinicOS.Infrastructure.Services
{
    public class PrescriptionService : IPrescriptionService
    {
        private readonly PrescriptionRepository _prescriptionRepository;
        private readonly VisitRepository _visitRepository;
        private readonly IMapper _mapper;

        public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            VisitRepository visitRepository,
            IMapper mapper)
        {
            _prescriptionRepository = prescriptionRepository;
            _visitRepository = visitRepository;
            _mapper = mapper;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<PrescriptionDto?> GetByVisitIdAsync(int visitId)
        {
            if (visitId <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(visitId));

            var prescription = await _prescriptionRepository.GetByVisitIdAsync(visitId);
            
            if (prescription == null)
                return null;

            return _mapper.Map<PrescriptionDto>(prescription);
        }

        public async Task<PrescriptionDto> CreateAsync(CreatePrescriptionDto dto)
        {
            // Validate input
            if (dto.VisitId <= 0)
                throw new ArgumentException("Invalid visit ID", nameof(dto.VisitId));

            if (string.IsNullOrWhiteSpace(dto.Instructions))
                throw new ArgumentException("Instructions are required", nameof(dto.Instructions));

            if (dto.FollowUpDate < DateTime.Now)
                throw new ArgumentException("Follow-up date must be in the future", nameof(dto.FollowUpDate));

            // Check if prescription already exists for this visit
            var existingPrescription = await _prescriptionRepository.GetByVisitIdAsync(dto.VisitId);
            if (existingPrescription != null)
                throw new Exception("A prescription already exists for this visit");

            // Create new prescription
            var prescription = new Prescription
            {
                VisitId = dto.VisitId,
                Instructions = dto.Instructions,
                FollowUpDate = dto.FollowUpDate,
                IssuedAt = DateTime.UtcNow,
                PrescriptionMedicines = new List<PrescriptionMedicine>()
            };

            // Add medicines
            if (dto.Medicines != null && dto.Medicines.Any())
            {
                foreach (var medicine in dto.Medicines)
                {
                    prescription.PrescriptionMedicines.Add(new PrescriptionMedicine
                    {
                        MedicineName = medicine.MedicineName,
                        Dosage = medicine.Dosage,
                        Frequency = medicine.Frequency,
                        Duration = medicine.Duration
                    });
                }
            }

            await _prescriptionRepository.AddAsync(prescription);
            await _prescriptionRepository.SaveChangesAsync();

            return _mapper.Map<PrescriptionDto>(prescription);
        }

        public async Task<byte[]> ExportPdfAsync(int prescriptionId)
        {
            if (prescriptionId <= 0)
                throw new ArgumentException("Invalid prescription ID", nameof(prescriptionId));

            var prescription = await _prescriptionRepository.GetByIdWithDetailsAsync(prescriptionId);
            
            if (prescription == null)
                throw new Exception("Prescription not found");

            var patient = prescription.Visit.Patient;
            var doctor = prescription.Visit.Doctor.User;

            try
            {
                var pdf = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(20);

                        page.Header().Element(header =>
                        {
                            header.Row(row =>
                            {
                                row.RelativeItem().Text("PRESCRIPTION")
                                    .FontSize(24)
                                    .Bold();

                                row.RelativeItem().AlignRight().Element(rightContent =>
                                {
                                    rightContent.Column(col =>
                                    {
                                        col.Item().Text($"Date: {prescription.IssuedAt:yyyy-MM-dd}").FontSize(10);
                                        col.Item().Text($"Prescription #: {prescription.Id}").FontSize(10);
                                    });
                                });
                            });
                        });

                        page.Content().PaddingVertical(20).Column(column =>
                        {
                            // Patient Information
                            column.Item().Element(patientSection =>
                            {
                                patientSection.Column(col =>
                                {
                                    col.Item().Text("PATIENT INFORMATION").Bold().FontSize(12);
                                    col.Item().PaddingTop(10).Row(row =>
                                    {
                                        row.RelativeItem().Text($"Name: {patient.Name}");
                                        row.RelativeItem().Text($"Age: {patient.Age}");
                                        row.RelativeItem().Text($"Phone: {patient.Phone}");
                                    });
                                    col.Item().Text($"Address: {patient.Address}");
                                    col.Item().Text($"Blood Group: {patient.BloodGroup}");
                                });
                            });

                            column.Item().PaddingTop(15).Element(doctorSection =>
                            {
                                doctorSection.Column(col =>
                                {
                                    col.Item().Text("DOCTOR INFORMATION").Bold().FontSize(12);
                                    col.Item().PaddingTop(10).Row(row =>
                                    {
                                        row.RelativeItem().Text($"Doctor: Dr. {doctor.FullName}");
                                        row.RelativeItem().Text($"Phone: {doctor.PhoneNumber}");
                                    });
                                });
                            });

                            // Medicines Table
                            column.Item().PaddingTop(15).Element(medicinesSection =>
                            {
                                medicinesSection.Column(col =>
                                {
                                    col.Item().Text("PRESCRIBED MEDICINES").Bold().FontSize(12);
                                    
                                    col.Item().PaddingTop(10).Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn(2);
                                            columns.RelativeColumn(1.5f);
                                            columns.RelativeColumn(1.5f);
                                            columns.RelativeColumn(1);
                                        });

                                        // Header
                                        table.Header(header =>
                                        {
                                            header.Cell().Element(cell => DefaultCellStyle(cell, "Medicine Name", true));
                                            header.Cell().Element(cell => DefaultCellStyle(cell, "Dosage", true));
                                            header.Cell().Element(cell => DefaultCellStyle(cell, "Frequency", true));
                                            header.Cell().Element(cell => DefaultCellStyle(cell, "Duration", true));
                                        });

                                        // Medicines
                                        foreach (var medicine in prescription.PrescriptionMedicines)
                                        {
                                            table.Cell().Element(cell => DefaultCellStyle(cell, medicine.MedicineName));
                                            table.Cell().Element(cell => DefaultCellStyle(cell, medicine.Dosage));
                                            table.Cell().Element(cell => DefaultCellStyle(cell, medicine.Frequency));
                                            table.Cell().Element(cell => DefaultCellStyle(cell, medicine.Duration));
                                        }
                                    });
                                });
                            });

                            // Instructions
                            column.Item().PaddingTop(15).Element(instructionsSection =>
                            {
                                instructionsSection.Column(col =>
                                {
                                    col.Item().Text("INSTRUCTIONS & NOTES").Bold().FontSize(12);
                                    col.Item().PaddingTop(10).Text(prescription.Instructions).FontSize(10);
                                });
                            });

                            // Follow-up
                            column.Item().PaddingTop(15).Element(followUpSection =>
                            {
                                followUpSection.Column(col =>
                                {
                                    col.Item().Text($"Follow-up Date: {prescription.FollowUpDate:yyyy-MM-dd}")
                                        .Bold()
                                        .FontSize(11);
                                });
                            });
                        });

                        page.Footer().AlignCenter().Text(text =>
                        {
                            text.Span("Generated on: ").FontSize(9);
                            text.Span(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")).FontSize(9);
                        });
                    });
                }).GeneratePdf();

                return pdf;
            }
            catch (Exception ex)
            {
                throw new Exception("Error generating PDF", ex);
            }
        }

        private void DefaultCellStyle(IContainer container, string text, bool isHeader = false)
        {
            if (isHeader)
            {
                container
                    .Padding(10)
                    .BorderBottom(1)
                    .Text(text)
                    .FontSize(11)
                    .Bold();
            }
            else
            {
                container
                    .Padding(10)
                    .BorderBottom(1)
                    .Text(text)
                    .FontSize(10);
            }
        }
    }
}
