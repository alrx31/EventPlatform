using MediatR;

namespace EventPlatform.Application.Admin.Queries.GetUserById;

public record GetUserByIdQuery(Guid UserId) : IRequest<AdminUserDetailDto?>;

public record AdminUserDetailDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    bool IsBlocked,
    bool IsApprovedOrganizer,
    DateTime CreatedAt,
    int EventsCount,
    int RegistrationsCount);
