'use client'

import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { MyRegistration } from '@/types';
import { formatDate, money } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';

export default function TicketModal({ registration, onClose }: { registration: MyRegistration; onClose: () => void }) {
    const { t } = useTranslation();
    const { userName } = useAuth();
    const info = [
        [t('ui.ticket.attendee'), userName ?? '—'],
        [t('ui.ticket.type'), registration.ticketTypeName],
        [t('ui.ticket.price'), registration.isFree ? t('free') : `$${money(registration.ticketPrice)}`],
        [t('ui.ticket.order'), `№ ${registration.registrationId.slice(0, 8).toUpperCase()}`],
    ];

    return (
        <Modal onClose={onClose} label={t('ui.ticket.label')} width="max-w-[400px]" className="overflow-hidden print:shadow-none">
            <div className="flex flex-col gap-1 bg-gradient-to-br from-brand-600 to-[#7c3aed] p-6 text-white">
                <div className="flex items-center justify-between">
                    <p className="caps-label text-white/75">{t('ui.ticket.label')}</p>
                    <button onClick={onClose} aria-label={t('close')} className="-mr-2 rounded-[10px] p-1.5 text-white hover:bg-white/15 print:hidden">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <h2 className="text-[22px] font-semibold leading-[30px]">{registration.eventTitle}</h2>
                <p className="text-sm text-white/85">
                    {formatDate(registration.eventStartDate, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {registration.eventLocation}
                </p>
            </div>
            <div className="border-t border-dashed border-line-strong" />
            <div className="flex flex-col items-center gap-4 p-6">
                <StatusBadge status={registration.ticketStatus} kind="ticket" size="md" />
                <div className="rounded-[10px] bg-white p-3">
                    <QRCodeSVG value={registration.registrationId} size={180} level="Q" fgColor="#0f172a" />
                </div>
                <p className="font-mono text-[13px] font-medium tracking-wide text-subtle">ID {registration.registrationId}</p>
                <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-3">
                    {info.map(([k, v]) => (
                        <div key={k}>
                            <dt className="text-xs font-medium text-subtle">{k}</dt>
                            <dd className="text-sm font-semibold text-ink">{v}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div className="flex gap-3 px-6 pb-6 print:hidden">
                <button onClick={() => window.print()} className="btn btn-secondary flex-1"><Printer aria-hidden="true" />{t('ui.ticket.print')}</button>
                <button onClick={onClose} className="btn btn-primary flex-1">{t('ui.ticket.done')}</button>
            </div>
        </Modal>
    );
}
