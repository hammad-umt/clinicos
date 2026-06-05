using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;
        private readonly ILogger<DoctorController> _logger;

        public DoctorController(IDoctorService doctorService, ILogger<DoctorController> logger)
        {
            _doctorService = doctorService;
            _logger = logger;
        }

        [HttpGet]
        [HttpGet]
public async Task<ActionResult<IEnumerable<DoctorDto>>> GetAll()
{
    try
    {
        var result = await _doctorService.GetAllAsync();

        var doctors = result.Select(d => new DoctorDto
        {
            Id = d.Id,
            Name = d.Name,
            Phone = d.Phone,
            Email = d.Email,
            Specialization = d.Specialization,
            ConsultationFee = d.ConsultationFee,
            DepartmentName = d.DepartmentName,
            IsActive = d.IsActive
        }).ToList();

        return Ok(doctors);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting all doctors");
        return BadRequest(new { message = ex.Message });
    }
}



        [HttpPost]
        public async Task<ActionResult<DoctorDto>> Create([FromBody] CreateDoctorDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _doctorService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating doctor");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateDoctorDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                await _doctorService.UpdateAsync(id, dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating doctor");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _doctorService.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting doctor");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
