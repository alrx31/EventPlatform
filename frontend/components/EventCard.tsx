'use client'

import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { EventSummary } from '@/types';
import { fmt, formatDate, money } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import EventCover from '@/components/ui/EventCover';
import StatusBadge from '@/components/ui/StatusBadge';

export default function EventCard({ event, href }: { event: EventSummary; href?: string }) {
    const { t } = useTranslation();
    const soldOut = event.availableTickets === 0 && (event.totalTickets ?? 0) > 0;
    const noTypes = (event.totalTickets ?? -1) === 0;
    const fewLeft = !soldOut && event.availableTickets > 0 && event.availableTickets <= 10;
    const price = event.minPrice == null
        ? t('ui.card.noPrice')
        : event.minPrice === 0 ? fmt(t('ui.card.from'), { price: '$0' }) : fmt(t('ui.card.from'), { price: `$${money(event.minPrice)}` });

    return (
        <Link href={href ?? `/events/${event.id}`} className="group block h-full rounded-[14px] focus-visible:outline-offset-4">
            <article className="card flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-card-hover">
                <EventCover seed={event.id} date={event.startDate} className="h-[180px] w-full" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={event.status} />
                        {(fewLeft || soldOut) && (
                            <span className={`text-xs font-medium ${soldOut ? 'text-danger-fg' : 'text-accent-600'}`}>
                                {soldOut ? t('ui.card.soldOut') : t('ui.card.fewLeft')}
                            </span>
                        )}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-semibold leading-[26px] text-ink transition-colors group-hover:text-brand-600">{event.title}</h3>
                    <ul className="flex flex-col gap-2 text-sm text-muted">
                        <li className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                            {formatDate(event.startDate, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </li>
                        <li className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                            <span className="truncate">{event.location}</span>
                        </li>
                        <li className={`flex items-center gap-2 ${soldOut ? 'text-danger-fg' : fewLeft ? 'text-accent-600' : ''}`}>
                            <Ticket className={`h-4 w-4 shrink-0 ${soldOut ? 'text-danger-fg' : fewLeft ? 'text-accent-600' : 'text-subtle'}`} aria-hidden="true" />
                            {noTypes ? t('ui.myEvents.noSales') : soldOut ? t('ui.card.noTickets') : fewLeft ? fmt(t('ui.card.left'), { count: event.availableTickets }) : fmt(t('ui.card.available'), { count: event.availableTickets })}
                        </li>
                    </ul>
                    <div className="mt-auto flex items-center gap-2 border-t border-neutral-bg pt-3">
                        <span className="flex-1 truncate text-xs font-medium text-subtle">{event.organizerName}</span>
                        <span className="text-sm font-semibold text-ink">{price}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
