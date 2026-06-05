using ClinicOS.Application.Dtos;
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TokenController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly ILogger<TokenController> _logger;

        public TokenController(ITokenService tokenService, ILogger<TokenController> logger)
        {
            _tokenService = tokenService;
            _logger = logger;
        }

        [HttpGet("today/{doctorId}")]
        public async Task<ActionResult<IEnumerable<TokenDto>>> GetTodayTokens(int doctorId)
        {
            try
            {
                var result = await _tokenService.GetTodayTokensAsync(doctorId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting today's tokens");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<TokenDto>> Create([FromBody] CreateTokenDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _tokenService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetTodayTokens), new { doctorId = dto.DoctorId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating token");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] TokenStatus status)
        {
            try
            {
                await _tokenService.UpdateStatusAsync(id, status);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating token status");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
