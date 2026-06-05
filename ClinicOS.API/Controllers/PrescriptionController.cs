using ClinicOS.Application.DTOs.Prescription;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionService _prescriptionService;
        private readonly ILogger<PrescriptionController> _logger;

        public PrescriptionController(IPrescriptionService prescriptionService, ILogger<PrescriptionController> logger)
        {
            _prescriptionService = prescriptionService;
            _logger = logger;
        }

        [HttpGet("visit/{visitId}")]
        public async Task<ActionResult<PrescriptionDto>> GetByVisitId(int visitId)
        {
            try
            {
                var result = await _prescriptionService.GetByVisitIdAsync(visitId);
                if (result == null)
                    return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting prescription");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<PrescriptionDto>> Create([FromBody] CreatePrescriptionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _prescriptionService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByVisitId), new { visitId = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating prescription");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> ExportPdf(int id)
        {
            try
            {
                var pdf = await _prescriptionService.ExportPdfAsync(id);
                return File(pdf, "application/pdf", $"prescription_{id}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting prescription to PDF");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
