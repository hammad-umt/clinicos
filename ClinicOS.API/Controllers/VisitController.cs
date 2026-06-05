using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VisitController : ControllerBase
    {
        private readonly IVisitService _visitService;
        private readonly ILogger<VisitController> _logger;

        public VisitController(IVisitService visitService, ILogger<VisitController> logger)
        {
            _visitService = visitService;
            _logger = logger;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VisitDto>> GetById(int id)
        {
            try
            {
                var result = await _visitService.GetByIdAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting visit");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<VisitDto>>> GetPatientHistory(int patientId)
        {
            try
            {
                var result = await _visitService.GetPatientHistoryAsync(patientId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient history");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<VisitDto>> Create([FromBody] CreateVisitDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _visitService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating visit");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<VisitDto>> Update(int id, [FromBody] CreateVisitDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _visitService.UpdateAsync(id, dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating visit");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
