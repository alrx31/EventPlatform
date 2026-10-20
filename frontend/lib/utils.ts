export function formatDate(
    dateString: string,
    options?: Intl.DateTimeFormatOptions,
    showTime: boolean = false
) {
    const locale = typeof window !== 'undefined' 
        ? (localStorage.getItem('language') === 'en' ? 'en-US' : 'ru-RU')
        : 'ru-RU';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(showTime && { hour: '2-digit', minute: '2-digit' }),
    };

    const opts = options ?? defaultOptions;
    const text = opts.hour ? new Date(dateString).toLocaleString(locale, opts) : new Date(dateString).toLocaleDateString(locale, opts);
    return text.replace(/\s?г\./g, '');
}

export function goBack(fallback: string = '/') {
    if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = fallback;
    }
}

export function fmt(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{{${k}}}`).join(String(v)), template);
}

export function money(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function apiError(err: unknown, fallback: string) {
    if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: { error?: string; message?: string } } }).response;
        return r?.data?.error || r?.data?.message || fallback;
    }
    return fallback;
}

export function userStatus(u: { isBlocked: boolean; role: string; isApprovedOrganizer: boolean }) {
    if (u.isBlocked) return 'Blocked';
    if (u.role === 'Organizer' && !u.isApprovedOrganizer) return 'Pending';
    return 'Active';
}
