using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Events.Queries.GetEvents;

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, PagedResult<EventSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cache;

    public GetEventsQueryHandler(IApplicationDbContext context,  ICacheService cache)
    {
        _context = context;
        _cache =  cache;
    }

    public async Task<PagedResult<EventSummaryDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"events:list:v2:{request.SearchTerm ?? "all"}:{request.Status ?? "all"}:page:{request.Page}:size:{request.PageSize}";
        
        var cached = await _cache.GetAsync<PagedResult<EventSummaryDto>>(cacheKey,  cancellationToken);
        if (cached is not null)
            return cached;
        
        var query = _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.TicketTypes)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<Domain.Enums.EventStatus>(request.Status, true, out var status))
        {
            query = query.Where(e => e.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(e =>
                e.Title.ToLower().Contains(searchTerm) ||
                e.Location.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(e => e.StartDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EventSummaryDto(
                e.Id,
                e.Title,
                e.Location,
                e.StartDate,
                e.Status.ToString(),
                e.Organizer.FullName,
                e.TicketTypes.Sum(tt => tt.TotalQuantity - tt.SoldQuantity),
                e.TicketTypes.Sum(tt => tt.TotalQuantity),
                e.TicketTypes.Min(tt => (decimal?)tt.Price),
                e.EndDate))
            .ToListAsync(cancellationToken);
        
        var result = new PagedResult<EventSummaryDto>(items, totalCount, request.Page, request.PageSize);
        
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), cancellationToken);
        
        return result;
    }
}