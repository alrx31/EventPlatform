'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarPlus, DollarSign, Plus, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EventSummary, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import DashboardEventCard from '@/components/DashboardEventCard';
import DashboardEventCardSkeleton from '@/components/DashboardEventCardSkeleton';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { fmt } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function MyEventsPage() {
    const { isAuthenticated, isLoading: authLoading, role, isApprovedOrganizer } = useAuth();
    const { t } = useTranslation();
    const [items, setItems] = useState<EventSummary[] | null>(null);
    const [tab, setTab] = useState('all');
    const canOrganize = role === 'Admin' || (role === 'Organizer' && isApprovedOrganizer);

    useEffect(() => {
        if (authLoading || !isAuthenticated || !canOrganize) return;
        api.get<PagedResult<EventSummary>>('/events/my', { params: { page: 1, pageSize: 100 } })
            .then(r => setItems(r.data.items))
            .catch(() => setItems([]));
    }, [authLoading, isAuthenticated, canOrganize]);

    const stats = useMemo(() => {
        const list = items ?? [];
        const sold = list.reduce((s, e) => s + ((e.totalTickets ?? 0) - e.availableTickets), 0);
        const available = list.filter(e => e.status === 'Published').reduce((s, e) => s + e.availableTickets, 0);
        return { total: list.length, published: list.filter(e => e.status === 'Published').length, sold, available };
    }, [items]);

    const filtered = (items ?? []).filter(e => tab === 'all' || e.status === tab);
    const count = (s: string) => (items ?? []).filter(e => e.status === s).length;

    return (
        <AppShell kind="user">
            <PageHeader
                title={t('ui.myEvents.title')}
                subtitle={t('ui.myEvents.subtitle')}
                actions={canOrganize && <Link href="/events/create" className="btn btn-primary"><Plus aria-hidden="true" />{t('nav.createEvent')}</Link>}
            />
            {!authLoading && !canOrganize ? (
                <Alert tone="warning" title={t('ui.myEvents.pendingTitle')}>{t('ui.myEvents.pendingText')}</Alert>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard tone="success" icon={CalendarCheck} label={t('ui.myEvents.published')} value={stats.published} hint={fmt(t('ui.myEvents.publishedHint'), { count: stats.total })} />
                        <StatCard tone="brand" icon={Ticket} label={t('ui.myEvents.sold')} value={stats.sold} hint={t('ui.myEvents.soldHint')} />
                        <StatCard tone="warning" icon={DollarSign} label={t('ui.myEvents.available')} value={stats.available} hint={t('ui.myEvents.availableHint')} />
                    </div>
                    <Tabs
                        active={tab}
                        onChange={setTab}
                        items={[
                            { key: 'all', label: t('ui.myEvents.all'), count: stats.total },
                            { key: 'Published', label: t('statusLabels.event.Published'), count: count('Published') },
                            { key: 'UnderReview', label: t('ui.myEvents.onReview'), count: count('UnderReview') },
                            { key: 'Draft', label: t('ui.myEvents.drafts'), count: count('Draft') },
                        ]}
                    />
                    {items === null ? (
                        <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <DashboardEventCardSkeleton key={i} />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="card">
                            <EmptyState
                                icon={CalendarPlus}
                                title={t('ui.myEvents.emptyTitle')}
                                text={t('ui.myEvents.emptyText')}
                                action={<Link href="/events/create" className="btn btn-primary"><Plus aria-hidden="true" />{t('nav.createEvent')}</Link>}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">{filtered.map(e => <DashboardEventCard key={e.id} event={e} />)}</div>
                    )}
                </>
            )}
        </AppShell>
    );
}
