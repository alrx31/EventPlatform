'use client'

import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Send } from 'lucide-react';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import EventCard from '@/components/EventCard';
import PageHeader from '@/components/ui/PageHeader';
import Stepper from '@/components/ui/Stepper';
import Alert from '@/components/ui/Alert';
import { apiError, fmt } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const createEventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    location: z.string().min(1, 'Location is required').max(300),
    startDate: z.string().min(1, 'Start Date is required'),
    endDate: z.string().min(1, 'End Date is required'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateEventForm>({ resolver: zodResolver(createEventSchema) });
    const values = watch();

    const onSubmit = async (data: CreateEventForm) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<{ id: string }>('/events', {
                ...data,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
            });
            router.push(`/dashboard/events/${response.data.id}/manage`);
        } catch (err) {
            setError(apiError(err, 'Failed to create event.'));
        } finally {
            setIsLoading(false);
        }
    };

    const minDate = new Date();
    minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
    const minDateString = minDate.toISOString().slice(0, 16);

    return (
        <AppShell kind="user">
            <Link href="/dashboard/events" className="btn btn-ghost btn-sm self-start"><ArrowLeft aria-hidden="true" />{t('ui.create.back')}</Link>
            <PageHeader title={t('ui.create.title')} subtitle={t('ui.create.subtitle')} />
            <Stepper steps={[t('ui.steps.description'), t('ui.steps.review'), t('ui.steps.tickets'), t('ui.steps.publish')]} current={0} />
            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                <form onSubmit={handleSubmit(onSubmit)} className="card flex min-w-0 flex-1 flex-col gap-5 p-6" noValidate>
                    <h2 className="text-lg font-semibold text-ink">{t('ui.create.main')}</h2>
                    <div>
                        <label className="label" htmlFor="title">{t('ui.create.name')}</label>
                        <input id="title" {...register('title')} aria-invalid={!!errors.title} className="input" placeholder={t('events.titlePlaceholder')} />
                        {errors.title && <p className="field-error">{errors.title.message}</p>}
                    </div>
                    <div>
                        <label className="label" htmlFor="description">{t('ui.create.description')}</label>
                        <textarea id="description" {...register('description')} aria-invalid={!!errors.description} rows={5} className="input" placeholder={t('events.descriptionPlaceholder')} />
                        {errors.description ? <p className="field-error">{errors.description.message}</p> : <p className="field-hint">{fmt(t('ui.create.chars'), { count: values.description?.length ?? 0 })}</p>}
                    </div>
                    <div>
                        <label className="label" htmlFor="location">{t('ui.create.place')}</label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                            <input id="location" {...register('location')} aria-invalid={!!errors.location} className="input input-with-icon" placeholder={t('events.locationPlaceholder')} />
                        </div>
                        {errors.location && <p className="field-error">{errors.location.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {(['startDate', 'endDate'] as const).map(f => (
                            <div key={f}>
                                <label className="label" htmlFor={f}>{f === 'startDate' ? t('ui.create.start') : t('ui.create.end')}</label>
                                <div className="relative">
                                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                                    <input id={f} {...register(f)} aria-invalid={!!errors[f]} type="datetime-local" min={minDateString} className="input input-with-icon" />
                                </div>
                                {errors[f] && <p className="field-error">{errors[f]?.message}</p>}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-1">
                        <Link href="/dashboard/events" className="btn btn-secondary">{t('cancel')}</Link>
                        <button type="submit" disabled={isLoading} className="btn btn-primary">
                            <Send aria-hidden="true" />
                            {isLoading ? t('events.creating') : t('ui.create.submit')}
                        </button>
                    </div>
                </form>

                <div className="flex w-full flex-col gap-4 xl:w-[384px] xl:shrink-0">
                    <p className="text-sm font-medium text-muted">{t('ui.create.preview')}</p>
                    <div className="pointer-events-none">
                        <EventCard
                            href="#"
                            event={{
                                id: values.title || 'preview',
                                title: values.title || t('ui.create.previewTitle'),
                                location: values.location || t('ui.create.previewPlace'),
                                startDate: values.startDate || new Date().toISOString(),
                                status: 'UnderReview',
                                organizerName: '—',
                                availableTickets: 0,
                                totalTickets: 0,
                                minPrice: null,
                            }}
                        />
                    </div>
                    <Alert tone="warning" title={t('ui.create.noteTitle')}>{t('ui.create.noteText')}</Alert>
                </div>
            </div>
        </AppShell>
    );
}
