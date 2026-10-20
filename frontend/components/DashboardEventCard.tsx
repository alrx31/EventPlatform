'use client'

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { EventSummary } from '@/types';
import { fmt, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import EventCover from '@/components/ui/EventCover';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function DashboardEventCard({ event }: { event: EventSummary }) {
    const { t } = useTranslation();
    const total = event.totalTickets ?? 0;
    const sold = total - event.availableTickets;
    const d: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const dates = event.endDate && new Date(event.endDate).toDateString() !== new Date(event.startDate).toDateString()
        ? `${formatDate(event.startDate, d)} – ${formatDate(event.endDate, d)}`
        : formatDate(event.startDate, d);

    return (
        <article className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <EventCover seed={event.id} showDate={false} className="hidden h-20 w-[120px] shrink-0 rounded-[10px] sm:block" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div><StatusBadge status={event.status} /></div>
                    <Link href={`/dashboard/events/${event.id}/manage`} className="truncate text-lg font-semibold leading-[26px] text-ink hover:text-brand-600">{event.title}</Link>
                    <span className="flex items-center gap-2 text-sm text-muted"><Calendar className="h-4 w-4 text-subtle" aria-hidden="true" />{dates}</span>
                </div>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-[200px]">
                <span className="text-xs font-medium text-subtle">{total > 0 ? fmt(t('ui.myEvents.sales'), { sold, total }) : t('ui.myEvents.noSales')}</span>
                <ProgressBar value={total > 0 ? (sold / total) * 100 : 0} />
            </div>
            <Link href={`/dashboard/events/${event.id}/manage`} className="btn btn-secondary shrink-0">{t('ui.myEvents.manage')}</Link>
        </article>
    );
}
