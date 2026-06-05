using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClinicController : ControllerBase
    {
        private readonly IClinicService _clinicService;
        private readonly ILogger<ClinicController> _logger;

        public ClinicController(IClinicService clinicService, ILogger<ClinicController> logger)
        {
            _clinicService = clinicService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ClinicDto>> Get()
        {
            try
            {
                var result = await _clinicService.GetAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting clinic info");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateClinicDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                await _clinicService.UpdateAsync(dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating clinic");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
