'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, DollarSign, ListChecks, Ticket, UserPlus, Users } from 'lucide-react';
import { AdminStats, EventSummary, PagedResult, PendingOrganizer } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import ProgressBar from '@/components/ui/ProgressBar';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate, money } from '@/lib/utils';
import { useTranslation } from '@/i18n';

type Action = { kind: 'event' | 'org'; type: 'approve' | 'reject'; id: string; name: string };

type TFn = (key: string) => string;

function Queue({ t, title, icon: Icon, count, href, rows }: { t: TFn; title: string; icon: typeof Users; count: number; href: string; rows: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-ink">{title}</h3>
                    {count > 0 && <StatusBadge status="UnderReview" label={fmt(t('ui.admin.waiting'), { count })} />}
                </div>
                <Link href={href} className="btn btn-ghost btn-sm">{t('ui.admin.openQueue')}</Link>
            </div>
            {rows}
        </div>
    );
}

function Row({ t, title, sub, onApprove, onReject }: { t: TFn; title: string; sub: string; onApprove: () => void; onReject: () => void }) {
    return (
        <div className="flex flex-col gap-3 rounded-[10px] bg-surface px-3 py-2.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{title}</p>
                <p className="truncate text-xs font-medium text-subtle">{sub}</p>
            </div>
            <div className="flex gap-2">
                <button onClick={onReject} className="btn btn-ghost btn-sm">{t('ui.admin.reject')}</button>
                <button onClick={onApprove} className="btn btn-primary btn-sm">{t('ui.admin.approve')}</button>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [events, setEvents] = useState<PagedResult<EventSummary> | null>(null);
    const [orgs, setOrgs] = useState<PagedResult<PendingOrganizer> | null>(null);
    const [action, setAction] = useState<Action | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        api.get<AdminStats>('/admin/stats').then(r => setStats(r.data)).catch(() => setError('Failed to load statistics.'));
        api.get<PagedResult<EventSummary>>('/admin/events/pending', { params: { page: 1, pageSize: 3 } }).then(r => setEvents(r.data)).catch(() => {});
        api.get<PagedResult<PendingOrganizer>>('/admin/organizers/pending', { params: { page: 1, pageSize: 3 } }).then(r => setOrgs(r.data)).catch(() => {});
    };
    useEffect(load, []);

    const doAction = async () => {
        if (!action) return;
        setBusy(true);
        try {
            const base = action.kind === 'event' ? `/admin/events/${action.id}` : `/admin/organizers/${action.id}`;
            await api.post(`${base}/${action.type}`);
            setAction(null);
            load();
        } catch (err) {
            setError(apiError(err, 'Failed to process request.'));
        } finally {
            setBusy(false);
        }
    };

    const byStatus = stats ? [
        ['Published', stats.publishedEvents],
        ['Draft', stats.draftEvents],
        ['Completed', stats.completedEvents],
        ['Cancelled', stats.cancelledEvents],
    ] as const : [];
    const pendingCount = events?.totalCount ?? 0;

    const d: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

    return (
        <AppShell kind="admin">
            <PageHeader title={t('ui.admin.overview')} subtitle={t('ui.admin.overviewSubtitle')} />
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard tone="brand" icon={Users} label={t('ui.admin.users')} value={stats?.totalUsers ?? '—'} hint={stats ? fmt(t('ui.admin.usersHint'), { count: stats.blockedUsers }) : undefined} />
                <StatCard tone="success" icon={CalendarCheck} label={t('ui.admin.published')} value={stats?.publishedEvents ?? '—'} hint={stats ? fmt(t('ui.admin.publishedHint'), { count: stats.totalEvents }) : undefined} />
                <StatCard icon={Ticket} label={t('ui.admin.registrations')} value={stats?.totalRegistrations ?? '—'} hint={t('ui.admin.registrationsHint')} />
                <StatCard tone="warning" icon={DollarSign} label={t('ui.admin.revenue')} value={stats ? `$${money(stats.totalRevenue)}` : '—'} hint={t('ui.admin.revenueHint')} />
            </div>

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <section className="card flex min-w-0 flex-1 flex-col gap-5 p-6">
                    <h2 className="text-lg font-semibold text-ink">{t('ui.admin.queues')}</h2>
                    <Queue
                        t={t}
                        title={t('ui.admin.pendingTitle')}
                        icon={ListChecks}
                        count={pendingCount}
                        href="/admin/events/pending"
                        rows={events?.items.length ? events.items.map(e => (
                            <Row t={t} key={e.id} title={e.title} sub={`${e.organizerName} · ${e.location} · ${formatDate(e.startDate, d)}`}
                                onApprove={() => setAction({ kind: 'event', type: 'approve', id: e.id, name: e.title })}
                                onReject={() => setAction({ kind: 'event', type: 'reject', id: e.id, name: e.title })} />
                        )) : <p className="rounded-[10px] bg-surface px-3 py-2.5 text-sm text-subtle">{t('ui.admin.queueEmpty')}</p>}
                    />
                    <Queue
                        t={t}
                        title={t('ui.admin.orgsTitle')}
                        icon={UserPlus}
                        count={orgs?.totalCount ?? 0}
                        href="/admin/organizers"
                        rows={orgs?.items.length ? orgs.items.map(o => (
                            <Row t={t} key={o.id} title={o.fullName} sub={`${o.email} · ${formatDate(o.createdAt, d)}`}
                                onApprove={() => setAction({ kind: 'org', type: 'approve', id: o.id, name: o.fullName })}
                                onReject={() => setAction({ kind: 'org', type: 'reject', id: o.id, name: o.fullName })} />
                        )) : <p className="rounded-[10px] bg-surface px-3 py-2.5 text-sm text-subtle">{t('ui.admin.queueEmpty')}</p>}
                    />
                </section>

                <div className="flex w-full flex-col gap-4 xl:w-[340px] xl:shrink-0">
                    <section className="card flex flex-col gap-3.5 p-5">
                        <h2 className="text-lg font-semibold text-ink">{t('ui.admin.byStatus')}</h2>
                        {[...byStatus, ['UnderReview', pendingCount] as const].map(([s, n]) => (
                            <div key={s} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <StatusBadge status={s} />
                                    <span className="text-sm font-semibold text-ink">{n}</span>
                                </div>
                                <ProgressBar value={stats?.totalEvents ? (n / stats.totalEvents) * 100 : 0} />
                            </div>
                        ))}
                    </section>
                    <section className="card flex flex-col gap-2 p-5">
                        <h2 className="text-lg font-semibold text-ink">{t('ui.admin.blocked')}</h2>
                        <p className="text-sm text-muted">{fmt(t('ui.admin.blockedText'), { count: stats?.blockedUsers ?? 0 })}</p>
                        <Link href="/admin/users" className="btn btn-secondary mt-1 w-full"><Users aria-hidden="true" />{t('ui.admin.manageUsers')}</Link>
                    </section>
                </div>
            </div>

            {action && (
                <ConfirmDialog
                    danger={action.type === 'reject'}
                    title={fmt(t(action.kind === 'event' ? (action.type === 'approve' ? 'ui.admin.approveTitle' : 'ui.admin.rejectTitle') : (action.type === 'approve' ? 'ui.admin.approveOrgTitle' : 'ui.admin.rejectOrgTitle')), { name: action.name })}
                    message={t(action.kind === 'event' ? (action.type === 'approve' ? 'ui.admin.approveText' : 'ui.admin.rejectText') : (action.type === 'approve' ? 'ui.admin.approveOrgText' : 'ui.admin.rejectOrgText'))}
                    confirmLabel={action.type === 'approve' ? t('ui.admin.approve') : t('ui.admin.reject')}
                    onConfirm={doAction}
                    onClose={() => setAction(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
