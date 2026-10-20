namespace EventPlatform.Application.Registrations.Commands.CheckInTicket;

public record CheckInResultDto(
    string AttendeeName,
    string EventTitle,
    DateTime EventDate,
    string TicketTypeName);