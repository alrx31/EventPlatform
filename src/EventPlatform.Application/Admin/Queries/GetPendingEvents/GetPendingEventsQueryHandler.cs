using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Application.Common.Models;
using EventPlatform.Application.Events.Queries.GetEvents;
using EventPlatform.Domain.Enums;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Admin.Queries.GetPendingEvents;

public class GetPendingEventsQueryHandler : IRequestHandler<GetPendingEventsQuery, PagedResult<EventSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetPendingEventsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<EventSummaryDto>> Handle(GetPendingEventsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAdmin)
            throw new ForbiddenException();

        var query = _context.Events
            .Include(e => e.Organizer)
            .Include(e => e.TicketTypes)
            .AsNoTracking()
            .Where(e => e.Status == EventStatus.UnderReview);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(e =>
                e.Title.ToLower().Contains(searchTerm) ||
                e.Organizer.Email.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(e => e.CreatedAt)
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
