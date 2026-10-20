namespace EventPlatform.Application.Events.Queries.GetEvents;

public record EventSummaryDto(
    Guid Id,
    string Title,
    string Location,
    DateTime StartDate,
    string Status,
    string OrganizerName,
    int AvailableTickets,
    int TotalTickets,
    decimal? MinPrice,
    DateTime EndDate);