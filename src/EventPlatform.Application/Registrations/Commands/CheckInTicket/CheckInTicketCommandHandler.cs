using EventPlatform.Application.Common.Interfaces;
using EventPlatform.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EventPlatform.Application.Registrations.Commands.CheckInTicket;

public class CheckInTicketCommandHandler : IRequestHandler<CheckInTicketCommand, CheckInResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckInTicketCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CheckInResultDto> Handle(CheckInTicketCommand request, CancellationToken cancellationToken)
    {
        var query = _context.Tickets
            .Include(t => t.Registration)
            .ThenInclude(r => r.User)
            .Include(t => t.Registration)
            .ThenInclude(r => r.Event)
            .Include(t => t.Registration)
            .ThenInclude(r => r.TicketType);

        var ticket = Guid.TryParse(request.QrCode.Trim(), out var registrationId)
            ? await query.FirstOrDefaultAsync(t => t.RegistrationId == registrationId, cancellationToken)
            : await query.FirstOrDefaultAsync(t => t.QrCode == request.QrCode, cancellationToken);

        if (ticket is null)
            throw new DomainException("Invalid QR code.");

        if (ticket.Registration.Event.OrganizerId != _currentUserService.UserId)
            throw new DomainException("You are not authorized to check in attendees for this event.");
        
        ticket.MarkAsUsed();

        await _context.SaveChangesAsync(cancellationToken);

        return new CheckInResultDto(
            ticket.Registration.User.FullName,
            ticket.Registration.Event.Title,
            ticket.Registration.Event.StartDate,
            ticket.Registration.TicketType.Name);
    }
}