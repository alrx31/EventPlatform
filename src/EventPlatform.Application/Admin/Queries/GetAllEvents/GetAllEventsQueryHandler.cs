using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Application.Common.Models;
using EventPlatform.Application.Events.Queries.GetEvents;
using EventPlatform.Domain.Enums;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Admin.Queries.GetAllEvents;

public class GetAllEventsQueryHandler : IRequestHandler<GetAllEventsQuery, PagedResult<EventSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAllEventsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<EventSummaryDto>> Handle(GetAllEventsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAdmin)
            throw new ForbiddenException();

        var query = _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.TicketTypes)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(e =>
                e.Title.ToLower().Contains(searchTerm) ||
                e.Location.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<EventStatus>(request.Status, out var status))
        {
            query = query.Where(e => e.Status == status);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
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

        return new PagedResult<EventSummaryDto>(items, totalCount, request.Page, request.PageSize);
    }
}