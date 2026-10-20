'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MyRegistration, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import RegistrationCard from '@/components/RegistrationCard';
import RegistrationCardSkeleton from '@/components/RegistrationCardSkeleton';
import TicketModal from '@/components/TicketModal';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from '@/i18n';

type Tab = 'upcoming' | 'past' | 'cancelled';

function bucket(r: MyRegistration): Tab {
    if (r.ticketStatus === 'Cancelled' || r.eventStatus === 'Cancelled') return 'cancelled';
    if (r.ticketStatus === 'Used' || r.eventStatus === 'Completed' || new Date(r.eventStartDate) < new Date()) return 'past';
    return 'upcoming';
}

export default function MyTicketsPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { t } = useTranslation();
    const [items, setItems] = useState<MyRegistration[] | null>(null);
    const [tab, setTab] = useState<Tab>('upcoming');
    const [open, setOpen] = useState<MyRegistration | null>(null);

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;
        api.get<PagedResult<MyRegistration>>('/registrations/my', { params: { page: 1, pageSize: 100 } })
            .then(r => setItems(r.data.items))
            .catch(() => setItems([]));
    }, [authLoading, isAuthenticated]);

    const groups = useMemo(() => {
        const g: Record<Tab, MyRegistration[]> = { upcoming: [], past: [], cancelled: [] };
        (items ?? []).forEach(r => g[bucket(r)].push(r));
        g.upcoming.sort((a, b) => +new Date(a.eventStartDate) - +new Date(b.eventStartDate));
        g.past.sort((a, b) => +new Date(b.eventStartDate) - +new Date(a.eventStartDate));
        return g;
    }, [items]);

    const list = groups[tab];

    return (
        <AppShell kind="user">
            <PageHeader
                title={t('ui.tickets.title')}
                subtitle={t('ui.tickets.subtitle')}
                actions={<Link href="/" className="btn btn-secondary"><Search aria-hidden="true" />{t('ui.tickets.find')}</Link>}
            />
            <Tabs
                active={tab}
                onChange={(k) => setTab(k as Tab)}
                items={[
                    { key: 'upcoming', label: t('ui.tickets.upcoming'), count: groups.upcoming.length },
                    { key: 'past', label: t('ui.tickets.past'), count: groups.past.length },
                    { key: 'cancelled', label: t('ui.tickets.cancelled'), count: groups.cancelled.length },
                ]}
            />
            {tab === 'upcoming' && groups.upcoming.length > 0 && (
                <Alert tone="info" title={t('ui.tickets.hintTitle')}>{t('ui.tickets.hintText')}</Alert>
            )}
            {items === null ? (
                <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <RegistrationCardSkeleton key={i} />)}</div>
            ) : list.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={Ticket}
                        title={t('ui.tickets.emptyTitle')}
                        text={t('ui.tickets.emptyText')}
                        action={<Link href="/" className="btn btn-primary">{t('ui.tickets.browse')}</Link>}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {list.map(r => <RegistrationCard key={r.registrationId} registration={r} onShow={() => setOpen(r)} />)}
                </div>
            )}
            {open && <TicketModal registration={open} onClose={() => setOpen(null)} />}
        </AppShell>
    );
}
