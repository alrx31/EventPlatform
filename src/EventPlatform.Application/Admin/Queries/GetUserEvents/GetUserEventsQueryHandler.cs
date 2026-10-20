using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Application.Common.Models;
using EventPlatform.Application.Events.Queries.GetEvents;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Admin.Queries.GetUserEvents;

public class GetUserEventsQueryHandler : IRequestHandler<GetUserEventsQuery, PagedResult<EventSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserEventsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<EventSummaryDto>> Handle(GetUserEventsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAdmin)
            throw new ForbiddenException();

        var query = _context.Events
            .AsNoTracking()
            .Where(e => e.OrganizerId == request.UserId);

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
