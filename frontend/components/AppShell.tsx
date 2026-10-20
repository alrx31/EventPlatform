'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Calendar, CalendarCheck, CalendarPlus, Globe, LayoutDashboard, ListChecks, LogOut, LucideIcon, ShieldCheck, Ticket, UserPlus, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';
import api from '@/lib/api';

interface Item {
    href: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    count?: number;
}

function SideLink({ item }: { item: Item }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${item.active ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-muted hover:bg-neutral-bg hover:text-ink'}`}
        >
            <Icon className={`h-5 w-5 shrink-0 ${item.active ? 'text-brand-600' : 'text-subtle'}`} aria-hidden="true" />
            <span className="flex-1 truncate">{item.label}</span>
            {!!item.count && (
                <span className="rounded-full bg-accent-500 px-[7px] text-xs font-medium leading-5 text-white">{item.count}</span>
            )}
        </Link>
    );
}

export default function AppShell({ kind, children }: { kind: 'user' | 'admin'; children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { role, isApprovedOrganizer, logout } = useAuth();
    const { t } = useTranslation();
    const [counts, setCounts] = useState<{ events: number; orgs: number }>({ events: 0, orgs: 0 });
    const canOrganize = role === 'Admin' || (role === 'Organizer' && isApprovedOrganizer);

    useEffect(() => {
        if (kind !== 'admin' || role !== 'Admin') return;
        Promise.all([
            api.get('/admin/events/pending', { params: { page: 1, pageSize: 1 } }).catch(() => null),
            api.get('/admin/organizers/pending', { params: { page: 1, pageSize: 1 } }).catch(() => null),
        ]).then(([e, o]) => setCounts({ events: e?.data?.totalCount ?? 0, orgs: o?.data?.totalCount ?? 0 }));
    }, [kind, role, pathname]);

    const groups: { label: string; items: Item[] }[] = kind === 'admin'
        ? [{
            label: t('ui.side.administration'),
            items: [
                { href: '/admin', label: t('ui.side.overview'), icon: LayoutDashboard, active: pathname === '/admin' },
                { href: '/admin/events/pending', label: t('ui.side.pendingEvents'), icon: ListChecks, active: pathname.startsWith('/admin/events/pending'), count: counts.events },
                { href: '/admin/organizers', label: t('ui.side.organizerRequests'), icon: UserPlus, active: pathname.startsWith('/admin/organizers'), count: counts.orgs },
                { href: '/admin/events', label: t('ui.side.allEvents'), icon: Calendar, active: pathname === '/admin/events' },
                { href: '/admin/users', label: t('ui.side.users'), icon: Users, active: pathname.startsWith('/admin/users') },
            ],
        }]
        : [
            {
                label: t('ui.side.attendee'),
                items: [
                    { href: '/dashboard', label: t('ui.nav.tickets'), icon: Ticket, active: pathname === '/dashboard' },
                    { href: '/', label: t('ui.side.catalog'), icon: Calendar, active: false },
                ],
            },
            ...(canOrganize ? [{
                label: t('ui.side.organizer'),
                items: [
                    { href: '/dashboard/events', label: t('ui.nav.myEvents'), icon: CalendarCheck, active: pathname.startsWith('/dashboard/events') },
                    { href: '/events/create', label: t('nav.createEvent'), icon: CalendarPlus, active: pathname === '/events/create' },
                ],
            }] : []),
            ...(role === 'Admin' ? [{
                label: t('ui.side.administration'),
                items: [{ href: '/admin', label: t('ui.nav.admin'), icon: ShieldCheck, active: false }],
            }] : []),
        ];

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
                <aside className="hidden w-[272px] shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
                    <nav className="flex flex-1 flex-col gap-1" aria-label={t('ui.side.label')}>
                        {groups.map((g, gi) => (
                            <div key={g.label} className={`flex flex-col gap-1 ${gi > 0 ? 'mt-4' : ''}`}>
                                <p className="caps-label mb-1 px-3 text-subtle">{g.label}</p>
                                {g.items.map(item => <SideLink key={item.href + item.label} item={item} />)}
                            </div>
                        ))}
                        <div className="flex-1" />
                        {kind === 'admin' && <SideLink item={{ href: '/', label: t('ui.side.toCatalog'), icon: Globe, active: false }} />}
                        <button
                            onClick={() => { logout(); router.push('/'); }}
                            className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-muted hover:bg-neutral-bg hover:text-ink"
                        >
                            <LogOut className="h-5 w-5 text-subtle" aria-hidden="true" />
                            {t('nav.signOut')}
                        </button>
                    </nav>
                </aside>
                <main id="main" className="min-w-0 flex-1">
                    <div className="lg:hidden overflow-x-auto border-b border-line bg-white px-4 [scrollbar-width:none]">
                        <div className="flex gap-1 py-2">
                            {groups.flatMap(g => g.items).map(item => (
                                <Link key={item.href + item.label} href={item.href} className={`whitespace-nowrap rounded-[10px] px-3 py-2 text-sm ${item.active ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-muted'}`}>
                                    {item.label}{item.count ? ` · ${item.count}` : ''}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="mx-auto flex max-w-[1104px] flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
