'use client'

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CircleCheck, Clock, Lock, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EventDetail, TicketType, UserRegistration } from '@/types';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventDetailSkeleton from '@/components/EventDetailSkeleton';
import PaymentModal from '@/components/PaymentModal';
import EventCover from '@/components/ui/EventCover';
import StatusBadge from '@/components/ui/StatusBadge';
import Alert from '@/components/ui/Alert';
import Avatar from '@/components/ui/Avatar';
import { apiError, fmt, formatDate, goBack, money } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const DT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { t } = useTranslation();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [registration, setRegistration] = useState<UserRegistration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [busyTicket, setBusyTicket] = useState<string | null>(null);
    const [justRegistered, setJustRegistered] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payFor, setPayFor] = useState<TicketType | null>(null);

    const loadRegistration = async () => {
        try {
            const r = await api.get<UserRegistration>(`/registrations/my/${id}`);
            setRegistration(r.data);
            return r.data;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get<EventDetail>(`/events/${id}`);
                setEvent(response.data);
                if (isAuthenticated) await loadRegistration();
            } catch {
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };
        if (!authLoading) load();
    }, [id, router, isAuthenticated, authLoading]);

    const refreshEvent = async () => {
        const updated = await api.get<EventDetail>(`/events/${id}`);
        setEvent(updated.data);
    };

    const handleTicket = async (tt: TicketType) => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        setError(null);
        if (!tt.isFree) {
            setPayFor(tt);
            return;
        }
        setBusyTicket(tt.id);
        try {
            await api.post('/registrations', { eventId: id, ticketTypeId: tt.id });
            await loadRegistration();
            await refreshEvent();
            setJustRegistered(true);
        } catch (err) {
            setError(apiError(err, t('events.registerFailed')));
        } finally {
            setBusyTicket(null);
        }
    };

    const afterPayment = async () => {
        setPayFor(null);
        setJustRegistered(true);
        for (let i = 0; i < 4; i++) {
            const reg = await loadRegistration();
            if (reg?.ticketStatus === 'Active') break;
            await new Promise(r => setTimeout(r, 700));
        }
        await refreshEvent();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <EventDetailSkeleton />
            </div>
        );
    }
    if (!event) return null;

    const hasActive = registration?.ticketStatus === 'Active';
    const onSale = event.status === 'Published';
    const regTicket = event.ticketTypes.find(tt => tt.id === registration?.ticketTypeId);

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 pb-16 pt-6 xl:px-0">
                <button onClick={() => goBack('/')} className="btn btn-ghost btn-sm self-start">
                    <ArrowLeft aria-hidden="true" />
                    {t('ui.event.back')}
                </button>

                <EventCover seed={event.id} date={event.startDate} className="h-[200px] w-full rounded-[20px] md:h-[320px]" />

                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <div><StatusBadge status={event.status} size="md" /></div>
                            <h1 className="text-[26px] font-bold leading-8 tracking-tight text-ink md:text-[32px] md:leading-10">{event.title}</h1>
                            <div className="flex items-center gap-2.5">
                                <Avatar name={event.organizerName} />
                                <div>
                                    <p className="text-xs font-medium text-subtle">{t('ui.event.organizer')}</p>
                                    <p className="text-sm font-semibold text-ink">{event.organizerName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
                            {[
                                { icon: Calendar, label: t('ui.event.start'), value: formatDate(event.startDate, DT) },
                                { icon: Clock, label: t('ui.event.end'), value: formatDate(event.endDate, DT) },
                                { icon: MapPin, label: t('ui.event.place'), value: event.location },
                            ].map(f => (
                                <div key={f.label} className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-50">
                                        <f.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-subtle">{f.label}</p>
                                        <p className="text-sm font-semibold text-ink">{f.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <section className="flex flex-col gap-3">
                            <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('ui.event.about')}</h2>
                            <p className="whitespace-pre-wrap text-[15px] leading-6 text-muted">{event.description}</p>
                        </section>
                    </div>

                    <aside className="card flex w-full flex-col gap-4 p-5 lg:sticky lg:top-24 lg:w-[400px] lg:shrink-0">
                        {justRegistered && hasActive && (
                            <Alert
                                tone="success"
                                title={t('ui.event.successTitle')}
                                action={<Link href="/dashboard" className="btn btn-secondary btn-sm">{t('ui.event.myTickets')}</Link>}
                            >
                                {fmt(t('ui.event.successText'), { ticket: regTicket ? `${regTicket.name} · ${regTicket.isFree ? t('free') : `$${money(regTicket.price)}`}` : registration?.ticketTypeName ?? '' })}
                            </Alert>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-ink">{t('ui.event.tickets')}</h2>
                            <p className="text-sm text-muted">{t('ui.event.chooseTicket')}</p>
                        </div>
                        {!isAuthenticated && onSale && (
                            <Alert tone="info" title={t('ui.event.loginTitle')} action={<Link href="/auth/login" className="btn btn-secondary btn-sm">{t('ui.event.login')}</Link>}>
                                {t('ui.event.loginText')}
                            </Alert>
                        )}
                        {!onSale && <Alert tone="warning" title={t('ui.event.notOnSale')}>{t('ui.event.notOnSaleText')}</Alert>}
                        {error && <Alert tone="danger">{error}</Alert>}

                        {event.ticketTypes.length === 0 && <p className="text-sm text-subtle">{t('ui.event.noTicketTypes')}</p>}
                        {event.ticketTypes.map(tt => {
                            const mine = hasActive && registration?.ticketTypeId === tt.id;
                            const soldOut = tt.availableQuantity === 0;
                            return (
                                <div key={tt.id} className={`flex items-center gap-3 rounded-[14px] border p-4 ${mine ? 'border-success-border bg-success-bg' : 'border-line bg-white'}`}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">{tt.name}</p>
                                        <p className={`text-lg font-semibold leading-[26px] ${tt.isFree ? 'text-success-fg' : soldOut ? 'text-subtle' : 'text-ink'}`}>
                                            {tt.isFree ? t('free') : `$${money(tt.price)}`}
                                        </p>
                                        <p className="text-xs font-medium text-subtle">
                                            {soldOut ? fmt(t('ui.event.quotaFull'), { total: tt.totalQuantity }) : fmt(t('ui.event.quota'), { available: tt.availableQuantity, total: tt.totalQuantity })}
                                        </p>
                                    </div>
                                    {mine ? (
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-success-fg">
                                            <CircleCheck className="h-[18px] w-[18px]" aria-hidden="true" />
                                            {t('ui.event.registered')}
                                        </span>
                                    ) : onSale && (
                                        <button
                                            onClick={() => handleTicket(tt)}
                                            disabled={soldOut || busyTicket === tt.id || hasActive}
                                            className={`btn ${soldOut ? 'btn-secondary' : 'btn-primary'}`}
                                        >
                                            {busyTicket === tt.id ? t('events.processing') : soldOut ? t('ui.event.soldOut') : tt.isFree ? t('ui.event.register') : fmt(t('ui.event.buy'), { price: money(tt.price) })}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        <p className="flex items-start gap-2 text-xs font-medium text-subtle">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {t('ui.event.note')}
                        </p>
                    </aside>
                </div>
            </main>
            <Footer />

            {payFor && (
                <PaymentModal
                    amount={payFor.price}
                    ticketName={payFor.name}
                    eventTitle={event.title}
                    eventId={event.id}
                    ticketTypeId={payFor.id}
                    onSuccess={afterPayment}
                    onClose={() => setPayFor(null)}
                />
            )}
        </div>
    );
}
