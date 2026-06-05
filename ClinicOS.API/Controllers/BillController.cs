using ClinicOS.Application.DTOs.Bill;
using ClinicOS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicOS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BillController : ControllerBase
    {
        private readonly IBillService _billService;
        private readonly ILogger<BillController> _logger;

        public BillController(IBillService billService, ILogger<BillController> logger)
        {
            _billService = billService;
            _logger = logger;
        }

        [HttpGet("visit/{visitId}")]
        public async Task<ActionResult<BillDto>> GetByVisitId(int visitId)
        {
            try
            {
                var result = await _billService.GetByVisitIdAsync(visitId);
                if (result == null)
                    return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bill");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("token/{tokenId}")]
        public async Task<ActionResult<BillDto>> GetByTokenId(int tokenId)
        {
            try
            {
                var result = await _billService.GetByTokenIdAsync(tokenId);
                if (result == null)
                    return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bill by token");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("token")]
        public async Task<ActionResult<BillDto>> CreateFromToken([FromBody] CreateTokenBillDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _billService.CreateFromTokenAsync(dto.TokenId, dto.PatientId);
                return CreatedAtAction(nameof(GetByTokenId), new { tokenId = dto.TokenId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bill from token");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<BillDto>> Create([FromBody] CreateBillDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _billService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByVisitId), new { visitId = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bill");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/paid")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            try
            {
                await _billService.MarkAsPaidAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking bill as paid");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<BillDto>> UpdateCharges(int id, [FromBody] UpdateBillChargesDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _billService.UpdateChargesAsync(id, dto.ExtraCharges);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bill charges");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
