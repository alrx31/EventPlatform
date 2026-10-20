using EventPlatform.Application.Common.Models;
using MediatR;

namespace EventPlatform.Application.Admin.Queries.GetAllUsers;

public record GetAllUsersQuery(
    string? SearchTerm,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<UserDto>>;
    
public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    bool IsBlocked,
    bool IsApprovedOrganizer,
    DateTime CreatedAt,
    int EventsCount,
    int RegistrationsCount);