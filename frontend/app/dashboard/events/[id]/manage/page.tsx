'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Ban, Check, DollarSign, Eye, Plus, ScanLine, Send, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { EventDetail } from '@/types';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import EventCard from '@/components/EventCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Stepper from '@/components/ui/Stepper';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import ProgressBar from '@/components/ui/ProgressBar';
import { apiError, fmt, formatDate, money } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const updateEventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    location: z.string().min(1, 'Location is required').max(300),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
});

const addTicketTypeSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    price: z.number().min(0, 'Price cannot be negative'),
    totalQuantity: z.number().min(1, 'Quantity must be at least 1'),
});

type UpdateEventForm = z.infer<typeof updateEventSchema>;
type AddTicketTypeForm = z.infer<typeof addTicketTypeSchema>;

const toLocal = (iso: string) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export default function ManageEventPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<null | 'submit' | 'cancel'>(null);
    const [pending, setPending] = useState<UpdateEventForm | null>(null);

    const eventForm = useForm<UpdateEventForm>({ resolver: zodResolver(updateEventSchema) });
    const resetEventForm = eventForm.reset;
    const ticketForm = useForm<AddTicketTypeForm>({ resolver: zodResolver(addTicketTypeSchema), defaultValues: { price: 0, totalQuantity: 100 } });

    const load = async () => {
        const response = await api.get<EventDetail>(`/events/${id}`);
        setEvent(response.data);
        eventForm.reset({
            title: response.data.title,
            description: response.data.description,
            location: response.data.location,
            startDate: toLocal(response.data.startDate),
            endDate: toLocal(response.data.endDate),
        });
        return response.data;
    };

    useEffect(() => {
        api.get<EventDetail>(`/events/${id}`)
            .then(r => {
                setEvent(r.data);
                resetEventForm({
                    title: r.data.title,
                    description: r.data.description,
                    location: r.data.location,
                    startDate: toLocal(r.data.startDate),
                    endDate: toLocal(r.data.endDate),
                });
            })
            .catch(() => router.push('/dashboard/events'))
            .finally(() => setIsLoading(false));
    }, [id, router, resetEventForm]);

    const run = async (fn: () => Promise<unknown>, ok: string, fail: string) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await fn();
            setSuccessMessage(ok);
            await load();
        } catch (err) {
            setError(apiError(err, fail));
        } finally {
            setIsSubmitting(false);
            setConfirm(null);
        }
    };

    const submitEvent = (data: UpdateEventForm) => run(
        () => api.put(`/events/${id}`, { ...data, startDate: new Date(data.startDate).toISOString(), endDate: new Date(data.endDate).toISOString() }),
        t('manage.submittedForReview'),
        t('manage.failedToUpdate'),
    );

    const onAddTicket = (data: AddTicketTypeForm) => run(async () => {
        await api.post(`/events/${id}/ticket-types`, data);
        setShowTicketForm(false);
        ticketForm.reset({ name: '', price: 0, totalQuantity: 100 });
    }, t('manage.ticketAdded'), t('manage.failedToAddTicket'));

    if (isLoading || !event) {
        return (
            <AppShell kind="user">
                <div className="skeleton h-8 w-40" />
                <div className="skeleton h-12 w-2/3" />
                <div className="skeleton h-16" />
                <div className="skeleton h-64" />
            </AppShell>
        );
    }

    const s = event.status;
    const editable = s === 'Draft' || s === 'Rejected';
    const hasTickets = event.ticketTypes.length > 0;
    const totals = event.ticketTypes.reduce((acc, tt) => {
        const sold = tt.totalQuantity - tt.availableQuantity;
        return { total: acc.total + tt.totalQuantity, sold: acc.sold + sold, revenue: acc.revenue + sold * tt.price };
    }, { total: 0, sold: 0, revenue: 0 });

    const stepIndex = { UnderReview: 1, Rejected: 1, Draft: 2, Published: 3, Completed: 4, Cancelled: 0 }[s] ?? 0;
    const alertConf = {
        UnderReview: ['warning', t('ui.manage.reviewTitle'), t('ui.manage.reviewText')],
        Rejected: ['danger', t('ui.manage.rejectedTitle'), t('ui.manage.rejectedText')],
        Draft: hasTickets ? ['success', t('ui.manage.draftReadyTitle'), t('ui.manage.draftReadyText')] : ['info', t('ui.manage.draftEmptyTitle'), t('ui.manage.draftEmptyText')],
        Published: ['info', t('ui.manage.publishedTitle'), t('ui.manage.publishedText')],
        Cancelled: ['danger', t('ui.manage.cancelledTitle'), t('ui.manage.cancelledText')],
        Completed: ['info', t('ui.manage.completedTitle'), t('ui.manage.completedText')],
    }[s] as ['success' | 'warning' | 'info' | 'danger', string, string] | undefined;

    const d: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const subtitle = `${formatDate(event.startDate, d)} – ${formatDate(event.endDate, d)} · ${event.location}`;

    return (
        <AppShell kind="user">
            <Link href="/dashboard/events" className="btn btn-ghost btn-sm self-start"><ArrowLeft aria-hidden="true" />{t('ui.manage.back')}</Link>
            <PageHeader
                before={<div><StatusBadge status={s} size="md" /></div>}
                title={event.title}
                subtitle={subtitle}
                actions={
                    <>
                        {s === 'Draft' && (
                            <button onClick={() => run(() => api.post(`/events/${id}/publish`), t('manage.publishedSuccessfully'), t('manage.failedToPublish'))} disabled={isSubmitting || !hasTickets} className="btn btn-primary">
                                <Send aria-hidden="true" />{t('manage.publish')}
                            </button>
                        )}
                        {s === 'Published' && (
                            <>
                                <button onClick={() => setConfirm('cancel')} className="btn btn-ghost"><Ban aria-hidden="true" />{t('manage.cancelEvent')}</button>
                                <Link href={`/events/${id}`} className="btn btn-secondary"><Eye aria-hidden="true" />{t('ui.manage.onCatalog')}</Link>
                                <Link href={`/dashboard/events/${id}/check-in`} className="btn btn-primary"><ScanLine aria-hidden="true" />{t('ui.manage.openCheckin')}</Link>
                            </>
                        )}
                        {(s === 'UnderReview' || s === 'Draft') && (
                            <button onClick={() => setConfirm('cancel')} className="btn btn-ghost"><Ban aria-hidden="true" />{t('manage.cancelEvent')}</button>
                        )}
                    </>
                }
            />
            {s !== 'Cancelled' && (
                <Stepper steps={[t('ui.steps.description'), t('ui.steps.review'), t('ui.steps.tickets'), t('ui.steps.publish')]} current={stepIndex} rejected={s === 'Rejected'} />
            )}
            {alertConf && <Alert tone={alertConf[0]} title={alertConf[1]}>{alertConf[2]}</Alert>}
            {successMessage && <Alert tone="success">{successMessage}</Alert>}
            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-6">
                    <section className="flex flex-col gap-3">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('ui.manage.ticketTypes')}</h2>
                                <p className="text-sm text-muted">{s === 'UnderReview' || s === 'Rejected' ? t('ui.manage.ticketTypesLocked') : t('ui.manage.ticketTypesHint')}</p>
                            </div>
                            <button onClick={() => setShowTicketForm(v => !v)} disabled={s !== 'Draft'} className="btn btn-secondary btn-sm"><Plus aria-hidden="true" />{t('ui.manage.addType')}</button>
                        </div>

                        {showTicketForm && s === 'Draft' && (
                            <form onSubmit={ticketForm.handleSubmit(onAddTicket)} className="card flex flex-col gap-4 border-brand-200 p-5" noValidate>
                                <p className="text-sm font-semibold text-ink">{t('ui.manage.newType')}</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="label" htmlFor="tt-name">{t('ui.manage.colName')}</label>
                                        <input id="tt-name" {...ticketForm.register('name')} aria-invalid={!!ticketForm.formState.errors.name} className="input" placeholder="Стандарт" />
                                        {ticketForm.formState.errors.name && <p className="field-error">{ticketForm.formState.errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label" htmlFor="tt-price">{t('ui.manage.colPrice')}, $</label>
                                        <div className="relative">
                                            <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                                            <input id="tt-price" {...ticketForm.register('price', { valueAsNumber: true })} type="number" min="0" step="0.01" className="input input-with-icon" />
                                        </div>
                                        {ticketForm.formState.errors.price ? <p className="field-error">{ticketForm.formState.errors.price.message}</p> : <p className="field-hint">{t('ui.manage.priceHint')}</p>}
                                    </div>
                                    <div>
                                        <label className="label" htmlFor="tt-qty">{t('manage.ticketQuantity')}</label>
                                        <input id="tt-qty" {...ticketForm.register('totalQuantity', { valueAsNumber: true })} type="number" min="1" className="input" />
                                        {ticketForm.formState.errors.totalQuantity && <p className="field-error">{ticketForm.formState.errors.totalQuantity.message}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowTicketForm(false)} className="btn btn-ghost">{t('cancel')}</button>
                                    <button type="submit" disabled={isSubmitting} className="btn btn-primary"><Check aria-hidden="true" />{t('ui.manage.saveTicket')}</button>
                                </div>
                            </form>
                        )}

                        {hasTickets ? (
                            <div className="card overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>{t('ui.manage.colName')}</th>
                                            <th>{t('ui.manage.colPrice')}</th>
                                            <th>{t('ui.manage.colTotal')}</th>
                                            <th>{t('ui.manage.colSold')}</th>
                                            <th>{t('ui.manage.colLeft')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {event.ticketTypes.map(tt => (
                                            <tr key={tt.id}>
                                                <td className="font-semibold">{tt.name}</td>
                                                <td>{tt.isFree ? t('free') : `$${money(tt.price)}`}</td>
                                                <td>{tt.totalQuantity}</td>
                                                <td>{tt.totalQuantity - tt.availableQuantity}</td>
                                                <td>{tt.availableQuantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : !showTicketForm && (
                            <div className="card">
                                <EmptyState icon={Ticket} title={t('ui.manage.noTicketsTitle')} text={s === 'Draft' ? t('ui.manage.draftEmptyText') : t('ui.manage.noTicketsText')} />
                            </div>
                        )}
                    </section>

                    <form onSubmit={eventForm.handleSubmit((data) => { setPending(data); setConfirm('submit'); })} className="card flex flex-col gap-4 p-6" noValidate>
                        <h2 className="text-lg font-semibold text-ink">{t('ui.manage.details')}</h2>
                        <fieldset disabled={!editable} className="flex flex-col gap-4">
                            <div>
                                <label className="label" htmlFor="m-title">{t('ui.create.name')}</label>
                                <input id="m-title" {...eventForm.register('title')} aria-invalid={!!eventForm.formState.errors.title} className="input" />
                                {eventForm.formState.errors.title && <p className="field-error">{eventForm.formState.errors.title.message}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="m-desc">{t('ui.create.description')}</label>
                                <textarea id="m-desc" {...eventForm.register('description')} rows={4} className="input" />
                                {eventForm.formState.errors.description && <p className="field-error">{eventForm.formState.errors.description.message}</p>}
                            </div>
                            <div>
                                <label className="label" htmlFor="m-loc">{t('ui.create.place')}</label>
                                <input id="m-loc" {...eventForm.register('location')} className="input" />
                                {eventForm.formState.errors.location && <p className="field-error">{eventForm.formState.errors.location.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="label" htmlFor="m-start">{t('ui.create.start')}</label>
                                    <input id="m-start" {...eventForm.register('startDate')} type="datetime-local" className="input" />
                                </div>
                                <div>
                                    <label className="label" htmlFor="m-end">{t('ui.create.end')}</label>
                                    <input id="m-end" {...eventForm.register('endDate')} type="datetime-local" className="input" />
                                    {eventForm.formState.errors.endDate && <p className="field-error">{eventForm.formState.errors.endDate.message}</p>}
                                </div>
                            </div>
                        </fieldset>
                        {editable && (
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary"><Send aria-hidden="true" />{s === 'Rejected' ? t('manage.resubmit') : t('manage.submitForReview')}</button>
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex w-full flex-col gap-4 xl:w-[340px] xl:shrink-0">
                    {(s === 'Published' || s === 'Completed') ? (
                        <>
                            <div className="card flex flex-col gap-3 p-5">
                                <p className="text-sm font-medium text-muted">{t('ui.manage.sales')}</p>
                                <p className="flex items-baseline gap-1.5">
                                    <span className="text-[30px] font-bold leading-9 text-ink">{totals.sold}</span>
                                    <span className="text-sm text-muted">{fmt(t('ui.manage.salesOf'), { total: totals.total })}</span>
                                </p>
                                <ProgressBar value={totals.total ? (totals.sold / totals.total) * 100 : 0} />
                                <p className="text-xs font-medium text-subtle">{fmt(t('ui.manage.revenue'), { amount: money(totals.revenue) })}</p>
                            </div>
                            {s === 'Published' && (
                                <div className="card flex flex-col gap-3 p-5">
                                    <p className="text-sm font-medium text-muted">{t('ui.manage.checkin')}</p>
                                    <p className="text-sm text-muted">{fmt(t('ui.checkin.sold'), { count: totals.sold })}</p>
                                    <Link href={`/dashboard/events/${id}/check-in`} className="btn btn-primary w-full"><ScanLine aria-hidden="true" />{t('ui.manage.openCheckin')}</Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-muted">{t('ui.manage.preview')}</p>
                            <EventCard
                                event={{
                                    id: event.id, title: event.title, location: event.location, startDate: event.startDate, status: s,
                                    organizerName: event.organizerName, availableTickets: totals.total - totals.sold, totalTickets: totals.total,
                                    minPrice: hasTickets ? Math.min(...event.ticketTypes.map(tt => tt.price)) : null,
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {confirm === 'submit' && pending && (
                <ConfirmDialog
                    title={s === 'Rejected' ? t('manage.resubmit') : t('manage.submitForReview')}
                    message={t('manage.submitForReviewConfirm')}
                    confirmLabel={t('manage.submitForReview')}
                    onConfirm={() => submitEvent(pending)}
                    onClose={() => setConfirm(null)}
                    isLoading={isSubmitting}
                />
            )}
            {confirm === 'cancel' && (
                <ConfirmDialog
                    danger
                    title={fmt(t('ui.manage.cancelTitle'), { name: event.title })}
                    message={t('ui.manage.cancelText')}
                    confirmLabel={t('manage.cancelEvent')}
                    onConfirm={() => run(() => api.post(`/events/${id}/cancel`), t('manage.cancelledSuccessfully'), t('manage.failedToCancel'))}
                    onClose={() => setConfirm(null)}
                    isLoading={isSubmitting}
                />
            )}
        </AppShell>
    );
}
