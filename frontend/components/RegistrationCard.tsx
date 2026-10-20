'use client'

import Link from 'next/link';
import { Clock, MapPin, QrCode, Ticket } from 'lucide-react';
import { MyRegistration } from '@/types';
import { formatDate, money } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import DateBlock from '@/components/ui/DateBlock';
import StatusBadge from '@/components/ui/StatusBadge';

export default function RegistrationCard({ registration, onShow }: { registration: MyRegistration; onShow?: () => void }) {
    const { t } = useTranslation();
    const active = registration.ticketStatus === 'Active';

    return (
        <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <DateBlock date={registration.eventStartDate} muted={!active} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className={`truncate text-lg font-semibold leading-[26px] ${active ? 'text-ink' : 'text-muted'}`}>{registration.eventTitle}</h3>
                        <StatusBadge status={registration.ticketStatus} kind="ticket" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-subtle" aria-hidden="true" />{formatDate(registration.eventStartDate, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-subtle" aria-hidden="true" />{registration.eventLocation}</span>
                        <span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-subtle" aria-hidden="true" />{registration.ticketTypeName} · {registration.isFree ? t('free') : `$${money(registration.ticketPrice)}`}</span>
                    </div>
                </div>
            </div>
            {active && onShow ? (
                <button onClick={onShow} className="btn btn-secondary shrink-0"><QrCode aria-hidden="true" />{t('ui.tickets.show')}</button>
            ) : (
                <Link href={`/events/${registration.eventId}`} className="btn btn-ghost shrink-0">{t('ui.tickets.toEvent')}</Link>
            )}
        </article>
    );
}
