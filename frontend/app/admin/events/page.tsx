'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, Calendar, Search } from 'lucide-react';
import { EventSummary, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const FILTERS = ['All', 'Published', 'UnderReview', 'Draft', 'Completed', 'Cancelled'] as const;

export default function AdminEventsPage() {
    const { t } = useTranslation();
    const [events, setEvents] = useState<PagedResult<EventSummary> | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('All');
    const [error, setError] = useState<string | null>(null);
    const [cancel, setCancel] = useState<{ id: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const load = (s: string, st: string, page: number) => api.get<PagedResult<EventSummary>>('/admin/events', {
        params: { searchTerm: s || undefined, status: st === 'All' ? undefined : st, page, pageSize: 10 },
    }).then(r => setEvents(r.data)).catch(() => setError('Failed to load events.'));
    useEffect(() => { load('', 'All', 1); }, []);

    const doCancel = async () => {
        if (!cancel) return;
        setBusy(true);
        try {
            await api.post(`/admin/events/${cancel.id}/cancel`);
            setCancel(null);
            await load(search, status, events?.page ?? 1);
        } catch (err) {
            setError(apiError(err, 'Failed to cancel event.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppShell kind="admin">
            <PageHeader title={t('ui.admin.eventsTitle')} subtitle={events ? fmt(t('ui.admin.eventsSubtitle'), { count: events.totalCount }) : undefined} />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <form onSubmit={(e) => { e.preventDefault(); load(search, status, 1); }} className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('ui.admin.searchEvents')} aria-label={t('ui.admin.searchEvents')} className="input input-with-icon" />
                </form>
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                    {FILTERS.map(f => (
                        <button key={f} className="chip" aria-pressed={status === f} onClick={() => { setStatus(f); load(search, f, 1); }}>
                            {f === 'All' ? t('ui.admin.all') : t(`statusLabels.event.${f}`)}
                        </button>
                    ))}
                </div>
            </div>
            {error && <Alert tone="danger">{error}</Alert>}
            {events === null ? (
                <div className="skeleton h-64" />
            ) : events.items.length === 0 ? (
                <div className="card"><EmptyState icon={Calendar} title={t('ui.admin.noResults')} /></div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('ui.admin.colEvent')}</th>
                                <th>{t('ui.admin.colOrganizer')}</th>
                                <th>{t('ui.admin.colDate')}</th>
                                <th>{t('ui.admin.colStatus')}</th>
                                <th>{t('ui.admin.colSold')}</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {events.items.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <Link href={`/events/${e.id}`} className="font-semibold text-ink hover:text-brand-600">{e.title}</Link>
                                        <p className="text-xs font-medium text-subtle">{e.location}</p>
                                    </td>
                                    <td>{e.organizerName}</td>
                                    <td className="whitespace-nowrap">{formatDate(e.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td><StatusBadge status={e.status} /></td>
                                    <td className="whitespace-nowrap">{e.totalTickets ? `${e.totalTickets - e.availableTickets} / ${e.totalTickets}` : '—'}</td>
                                    <td className="text-right">
                                        {e.status !== 'Cancelled' && e.status !== 'Completed' ? (
                                            <button onClick={() => setCancel({ id: e.id, name: e.title })} className="btn btn-ghost btn-sm"><Ban aria-hidden="true" />{t('ui.admin.cancel')}</button>
                                        ) : (
                                            <Link href={`/events/${e.id}`} className="btn btn-ghost btn-sm">{t('ui.admin.details')}</Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {events && <Pagination page={events.page} totalPages={events.totalPages} hasNextPage={events.hasNextPage} hasPreviousPage={events.hasPreviousPage} onPageChange={(p) => load(search, status, p)} />}
            {cancel && (
                <ConfirmDialog
                    danger
                    title={fmt(t('ui.admin.cancelEventTitle'), { name: cancel.name })}
                    message={t('ui.admin.cancelEventText')}
                    confirmLabel={t('manage.cancelEvent')}
                    onConfirm={doCancel}
                    onClose={() => setCancel(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
