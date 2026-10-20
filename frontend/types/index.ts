export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

export interface EventSummary {
    id: string;
    title: string;
    location: string;
    startDate: string;
    status: string;
    organizerName: string;
    availableTickets: number;
    totalTickets?: number;
    minPrice?: number | null;
    endDate?: string;
}

export interface TicketType {
    id: string;
    name: string;
    price: number;
    isFree: boolean;
    totalQuantity: number;
    availableQuantity: number;
}

export interface EventDetail {
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    organizerName: string;
    createdAt: string;
    ticketTypes: TicketType[];
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface UserRegistration {
    registrationId: string;
    ticketTypeId: string;
    ticketTypeName: string;
    ticketStatus: string;
}

export interface MyRegistration {
    registrationId: string;
    eventId: string;
    eventTitle: string;
    eventLocation: string;
    eventStartDate: string;
    eventStatus: string;
    ticketTypeName: string;
    ticketPrice: number;
    isFree: boolean;
    ticketStatus: string;
}

export interface AdminStats {
    totalUsers: number;
    blockedUsers: number;
    totalEvents: number;
    publishedEvents: number;
    cancelledEvents: number;
    completedEvents: number;
    draftEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
}

export interface AdminUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isBlocked: boolean;
    isApprovedOrganizer: boolean;
    createdAt: string;
    eventsCount: number;
    registrationsCount: number;
}

export interface AdminUserDetail {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isBlocked: boolean;
    isApprovedOrganizer: boolean;
    createdAt: string;
    eventsCount: number;
    registrationsCount: number;
}

export interface AdminRegistration {
    registrationId: string;
    eventId: string;
    eventTitle: string;
    ticketTypeName: string;
    ticketPrice: number;
    isFree: boolean;
    ticketStatus: string;
    createdAt: string;
}

export interface PendingOrganizer {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
}