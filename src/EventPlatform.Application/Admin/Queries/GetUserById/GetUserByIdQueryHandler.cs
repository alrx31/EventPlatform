using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Admin.Queries.GetUserById;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, AdminUserDetailDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<AdminUserDetailDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAdmin)
            throw new ForbiddenException();

        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == request.UserId)
            .Select(u => new AdminUserDetailDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.IsBlocked,
                u.IsApprovedOrganizer,
                u.CreatedAt,
                u.OrganizedEvents.Count(),
                _context.Registrations.Count(r => r.UserId == u.Id)))
            .FirstOrDefaultAsync(cancellationToken);

        return user;
    }
}
