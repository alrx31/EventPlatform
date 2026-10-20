'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ListChecks, X } from 'lucide-react';
import { EventSummary, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function AdminPendingEventsPage() {
    const { t } = useTranslation();
    const [events, setEvents] = useState<PagedResult<EventSummary> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [action, setAction] = useState<{ type: 'approve' | 'reject'; id: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const load = (page: number) => api.get<PagedResult<EventSummary>>('/admin/events/pending', { params: { page, pageSize: 10 } })
        .then(r => setEvents(r.data)).catch(() => setError('Failed to load pending events.'));
    useEffect(() => { load(1); }, []);

    const doAction = async () => {
        if (!action) return;
        setBusy(true);
        try {
            await api.post(`/admin/events/${action.id}/${action.type}`);
            setAction(null);
            await load(events?.page ?? 1);
        } catch (err) {
            setError(apiError(err, 'Failed to process request.'));
        } finally {
            setBusy(false);
        }
    };

    const d: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

    return (
        <AppShell kind="admin">
            <PageHeader title={t('ui.admin.pendingTitle')} subtitle={t('ui.admin.pendingSubtitle')} />
            {error && <Alert tone="danger">{error}</Alert>}
            {events === null ? (
                <div className="skeleton h-64" />
            ) : events.items.length === 0 ? (
                <div className="card"><EmptyState icon={ListChecks} title={t('ui.admin.pendingEmpty')} /></div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('ui.admin.colEvent')}</th>
                                <th>{t('ui.admin.colOrganizer')}</th>
                                <th>{t('ui.admin.colDates')}</th>
                                <th className="text-right">{t('ui.admin.colActions')}</th>
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
                                    <td className="whitespace-nowrap">{formatDate(e.startDate, d)}{e.endDate ? ` – ${formatDate(e.endDate, d)}` : ''}</td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setAction({ type: 'reject', id: e.id, name: e.title })} className="btn btn-secondary btn-sm"><X aria-hidden="true" />{t('ui.admin.reject')}</button>
                                            <button onClick={() => setAction({ type: 'approve', id: e.id, name: e.title })} className="btn btn-primary btn-sm"><Check aria-hidden="true" />{t('ui.admin.approve')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {events && <Pagination page={events.page} totalPages={events.totalPages} hasNextPage={events.hasNextPage} hasPreviousPage={events.hasPreviousPage} onPageChange={load} />}
            {action && (
                <ConfirmDialog
                    danger={action.type === 'reject'}
                    title={fmt(t(action.type === 'approve' ? 'ui.admin.approveTitle' : 'ui.admin.rejectTitle'), { name: action.name })}
                    message={t(action.type === 'approve' ? 'ui.admin.approveText' : 'ui.admin.rejectText')}
                    confirmLabel={action.type === 'approve' ? t('ui.admin.approve') : t('ui.admin.reject')}
                    onConfirm={doAction}
                    onClose={() => setAction(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
