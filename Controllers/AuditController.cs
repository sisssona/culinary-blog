using CulinaryBlog.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Controllers;

[ApiController]
[Route("api/v1/audit")]
[Authorize(Roles = "Admin")]
public class AuditController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool all = false, [FromQuery] int take = 100)
    {
        take = Math.Clamp(take, 1, 200);

        var query = _context.AuditLogs.AsNoTracking().AsQueryable();
        if (!all)
        {
            query = query.Where(entry =>
                entry.Action.StartsWith("Delete") || entry.Action == "Reject");
        }

        var entries = await query
            .OrderByDescending(entry => entry.CreatedAt)
            .Take(take)
            .Select(entry => new
            {
                entry.Id,
                entry.CreatedAt,
                entry.UserId,
                entry.ActorName,
                entry.Action,
                entry.ResourceType,
                entry.ResourceId,
                entry.Details
            })
            .ToListAsync();

        return Ok(entries);
    }
}
