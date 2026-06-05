using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PatientController : ControllerBase
    {
        private readonly IPatientService _patientService;
        private readonly ILogger<PatientController> _logger;

        public PatientController(IPatientService patientService, ILogger<PatientController> logger)
        {
            _patientService = patientService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetAll()
        {
            try
            {
                var result = await _patientService.GetAllAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patients");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PatientDto>> GetById(int id)
        {
            try
            {
                var result = await _patientService.GetByIdAsync(id);
                if (result == null)
                    return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("search")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> Search([FromBody] SearchPatientDto dto)
        {
            try
            {
                var result = await _patientService.SearchAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching patients");
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost]
public async Task<ActionResult<PatientDto>> Create([FromBody] CreatePatientDto dto)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _patientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating patient");
        return BadRequest(new { message = ex.Message });
    }
}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreatePatientDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                await _patientService.UpdateAsync(id, dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
