'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ban, Calendar, Ticket } from 'lucide-react';
import { AdminRegistration, AdminUserDetail, EventSummary, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import Avatar from '@/components/ui/Avatar';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate, money, userStatus } from '@/lib/utils';
import { useTranslation } from '@/i18n';

type Confirm =
    | { kind: 'block' | 'unblock' }
    | { kind: 'event'; id: string; name: string }
    | { kind: 'registration'; id: string; name: string };

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [tab, setTab] = useState<'events' | 'registrations'>('events');
    const [events, setEvents] = useState<PagedResult<EventSummary> | null>(null);
    const [regs, setRegs] = useState<PagedResult<AdminRegistration> | null>(null);
    const [confirm, setConfirm] = useState<Confirm | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadUser = () => api.get<AdminUserDetail>(`/admin/users/${id}`).then(r => setUser(r.data)).catch(() => setError('Failed to load user.'));
    const loadEvents = (page: number) => api.get<PagedResult<EventSummary>>(`/admin/users/${id}/events`, { params: { page, pageSize: 10 } }).then(r => setEvents(r.data)).catch(() => {});
    const loadRegs = (page: number) => api.get<PagedResult<AdminRegistration>>(`/admin/users/${id}/registrations`, { params: { page, pageSize: 10 } }).then(r => setRegs(r.data)).catch(() => {});

    useEffect(() => { loadUser(); loadEvents(1); loadRegs(1); }, [id]);

    const doConfirm = async () => {
        if (!confirm) return;
        setBusy(true);
        try {
            if (confirm.kind === 'block' || confirm.kind === 'unblock') await api.post(`/admin/users/${id}/${confirm.kind}`);
            if (confirm.kind === 'event') await api.post(`/admin/events/${confirm.id}/cancel`);
            if (confirm.kind === 'registration') await api.post(`/admin/users/${id}/registrations/${confirm.id}/cancel`);
            setConfirm(null);
            await Promise.all([loadUser(), loadEvents(events?.page ?? 1), loadRegs(regs?.page ?? 1)]);
        } catch (err) {
            setError(apiError(err, 'Failed to process request.'));
        } finally {
            setBusy(false);
        }
    };

    const d: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const spent = (regs?.items ?? []).filter(r => r.ticketStatus !== 'Cancelled').reduce((s, r) => s + r.ticketPrice, 0);

    return (
        <AppShell kind="admin">
            <Link href="/admin/users" className="btn btn-ghost btn-sm self-start"><ArrowLeft aria-hidden="true" />{t('ui.admin.backToUsers')}</Link>
            {error && <Alert tone="danger">{error}</Alert>}
            {!user ? <div className="skeleton h-32" /> : (
                <>
                    <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                        <Avatar name={user.fullName} size="lg" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-[26px] font-bold leading-8 tracking-tight text-ink sm:text-[32px] sm:leading-10">{user.fullName}</h1>
                                <StatusBadge status={userStatus(user)} kind="user" size="md" />
                            </div>
                            <p className="text-sm text-muted">{user.email} · {t(`ui.admin.roles.${user.role}`)} · {fmt(t('ui.admin.joinedOn'), { date: formatDate(user.createdAt, d) })}</p>
                        </div>
                        {user.role !== 'Admin' && (user.isBlocked ? (
                            <button onClick={() => setConfirm({ kind: 'unblock' })} className="btn btn-secondary">{t('ui.admin.unblock')}</button>
                        ) : (
                            <button onClick={() => setConfirm({ kind: 'block' })} className="btn btn-danger"><Ban aria-hidden="true" />{t('ui.admin.block')}</button>
                        ))}
                    </section>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard icon={Calendar} label={t('ui.admin.eventsCreated')} value={user.eventsCount} hint={t('ui.admin.allTime')} />
                        <StatCard icon={Ticket} label={t('ui.admin.registrationsMade')} value={user.registrationsCount} hint={t('ui.admin.allTime')} />
                        <StatCard icon={Ticket} label={t('ui.admin.revenue')} value={`$${money(spent)}`} hint={t('ui.admin.allTime')} />
                    </div>
                </>
            )}
            <Tabs
                active={tab}
                onChange={(k) => setTab(k as 'events' | 'registrations')}
                items={[
                    { key: 'events', label: t('ui.admin.tabEvents'), count: events?.totalCount },
                    { key: 'registrations', label: t('ui.admin.tabRegistrations'), count: regs?.totalCount },
                ]}
            />
            {tab === 'events' && (events?.items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead><tr><th>{t('ui.admin.colEvent')}</th><th>{t('ui.admin.colDate')}</th><th>{t('ui.admin.colStatus')}</th><th>{t('ui.admin.colSold')}</th><th /></tr></thead>
                        <tbody>
                            {events.items.map(e => (
                                <tr key={e.id}>
                                    <td><Link href={`/events/${e.id}`} className="font-semibold hover:text-brand-600">{e.title}</Link><p className="text-xs font-medium text-subtle">{e.location}</p></td>
                                    <td className="whitespace-nowrap">{formatDate(e.startDate, d)}</td>
                                    <td><StatusBadge status={e.status} /></td>
                                    <td>{e.totalTickets ? `${e.totalTickets - e.availableTickets} / ${e.totalTickets}` : '—'}</td>
                                    <td className="text-right">
                                        {e.status !== 'Cancelled' && e.status !== 'Completed' && (
                                            <button onClick={() => setConfirm({ kind: 'event', id: e.id, name: e.title })} className="btn btn-ghost btn-sm"><Ban aria-hidden="true" />{t('ui.admin.cancel')}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <div className="card"><EmptyState icon={Calendar} title={t('userDetail.noEvents')} /></div>)}
            {tab === 'events' && events && <Pagination page={events.page} totalPages={events.totalPages} hasNextPage={events.hasNextPage} hasPreviousPage={events.hasPreviousPage} onPageChange={loadEvents} />}
            {tab === 'registrations' && (regs?.items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead><tr><th>{t('ui.admin.colEvent')}</th><th>{t('ui.admin.colTicket')}</th><th>{t('ui.admin.colDate')}</th><th>{t('ui.admin.colStatus')}</th><th /></tr></thead>
                        <tbody>
                            {regs.items.map(r => (
                                <tr key={r.registrationId}>
                                    <td><Link href={`/events/${r.eventId}`} className="font-semibold hover:text-brand-600">{r.eventTitle}</Link></td>
                                    <td>{r.ticketTypeName} · {r.isFree ? t('free') : `$${money(r.ticketPrice)}`}</td>
                                    <td className="whitespace-nowrap">{formatDate(r.createdAt, d)}</td>
                                    <td><StatusBadge status={r.ticketStatus} kind="ticket" /></td>
                                    <td className="text-right">
                                        {r.ticketStatus === 'Active' && (
                                            <button onClick={() => setConfirm({ kind: 'registration', id: r.registrationId, name: r.eventTitle })} className="btn btn-ghost btn-sm"><Ban aria-hidden="true" />{t('ui.admin.cancel')}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <div className="card"><EmptyState icon={Ticket} title={t('userDetail.noRegistrations')} /></div>)}
            {tab === 'registrations' && regs && <Pagination page={regs.page} totalPages={regs.totalPages} hasNextPage={regs.hasNextPage} hasPreviousPage={regs.hasPreviousPage} onPageChange={loadRegs} />}

            {confirm && user && (
                <ConfirmDialog
                    danger={confirm.kind !== 'unblock'}
                    title={confirm.kind === 'block' ? fmt(t('ui.admin.blockTitle'), { name: user.fullName })
                        : confirm.kind === 'unblock' ? fmt(t('ui.admin.unblockTitle'), { name: user.fullName })
                            : confirm.kind === 'event' ? fmt(t('ui.admin.cancelEventTitle'), { name: confirm.name })
                                : fmt(t('ui.admin.cancelRegTitle'), { name: 'name' in confirm ? confirm.name : '' })}
                    message={confirm.kind === 'block' ? t('ui.admin.blockText') : confirm.kind === 'unblock' ? t('ui.admin.unblockText') : confirm.kind === 'event' ? t('ui.admin.cancelEventText') : t('ui.admin.cancelRegText')}
                    confirmLabel={confirm.kind === 'block' ? t('ui.admin.block') : confirm.kind === 'unblock' ? t('ui.admin.unblock') : t('ui.admin.cancel')}
                    onConfirm={doConfirm}
                    onClose={() => setConfirm(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
