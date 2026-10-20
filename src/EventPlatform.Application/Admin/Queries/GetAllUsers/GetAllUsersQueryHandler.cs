using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Application.Common.Models;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Admin.Queries.GetAllUsers;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, PagedResult<UserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAllUsersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAdmin)
            throw new ForbiddenException();

        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLowerInvariant();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchTerm) ||
                u.FirstName.ToLower().Contains(searchTerm) ||
                u.LastName.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.IsBlocked,
                u.IsApprovedOrganizer,
                u.CreatedAt,
                u.OrganizedEvents.Count(),
                _context.Registrations.Count(r => r.UserId == u.Id)))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>(items, totalCount, request.Page, request.PageSize);
    }
}