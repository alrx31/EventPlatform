'use client'

import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { EventSummary, PagedResult } from '@/types';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import EventCardCompact from '@/components/EventCardCompact';
import EventCardSkeleton from '@/components/EventCardSkeleton';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from '@/i18n';
import { fmt } from '@/lib/utils';

const QUICK = ['Москва', 'Санкт-Петербург', 'Казань', 'Summit', 'Meetup'];

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
                <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-ink">{title}</h2>
                {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
            </div>
            {right}
        </div>
    );
}

export default function HomePage() {
    const { t } = useTranslation();
    const [events, setEvents] = useState<PagedResult<EventSummary> | null>(null);
    const [soon, setSoon] = useState<EventSummary[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [status, setStatus] = useState<'Published' | 'Completed'>('Published');
    const [isLoading, setIsLoading] = useState(true);

    const fetchEvents = async (search: string, st: string, page: number) => {
        setIsLoading(true);
        try {
            const response = await api.get<PagedResult<EventSummary>>('/events', {
                params: { searchTerm: search || undefined, status: st, page, pageSize: 9 },
            });
            setEvents(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        api.get<PagedResult<EventSummary>>('/events', { params: { status: 'Published', page: 1, pageSize: 9 } })
            .then(r => setEvents(r.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
        api.get<PagedResult<EventSummary>>('/events', { params: { status: 'Published', page: 1, pageSize: 4 } })
            .then(r => { setSoon(r.data.items); setTotal(r.data.totalCount); })
            .catch(() => {});
    }, []);

    const runSearch = (value: string) => {
        setSearchTerm(value);
        setActiveSearch(value);
        fetchEvents(value, status, 1);
    };

    const changeStatus = (st: 'Published' | 'Completed') => {
        setStatus(st);
        fetchEvents(activeSearch, st, 1);
    };

    const isEmptySearch = !isLoading && !!activeSearch && events?.items.length === 0;

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main" className="flex-1">
                <section className="border-b border-line bg-white">
                    <div className={`mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-4 text-left md:items-center md:text-center ${isEmptySearch ? 'py-10' : 'pb-14 pt-12 md:pt-[72px]'}`}>
                        {isEmptySearch ? (
                            <h1 className="text-[32px] font-bold leading-10 tracking-tight text-ink">{t('ui.home.resultsTitle')}</h1>
                        ) : (
                            <>
                                {total !== null && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-600">
                                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                                        {fmt(t('ui.home.pill'), { count: total })}
                                    </span>
                                )}
                                <h1 className="max-w-[820px] text-balance text-[32px] font-bold leading-10 tracking-[-0.8px] text-ink md:text-5xl md:leading-[56px] md:tracking-[-1.5px]">
                                    {t('ui.home.title')}
                                </h1>
                                <p className="max-w-[640px] text-balance text-[17px] leading-[26px] text-muted">{t('ui.home.subtitle')}</p>
                            </>
                        )}
                        <form
                            role="search"
                            onSubmit={(e) => { e.preventDefault(); runSearch(searchTerm); }}
                            className="flex w-full max-w-[720px] gap-2 rounded-[20px] border border-line bg-white p-2 shadow-card-hover"
                        >
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('ui.home.searchPlaceholder')}
                                    aria-label={t('ui.home.searchPlaceholder')}
                                    className="input input-with-icon [&::-webkit-search-cancel-button]:hidden"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">{t('ui.home.find')}</button>
                        </form>
                        <div className="flex flex-wrap items-center gap-2 md:justify-center">
                            <span className="text-sm font-medium text-subtle">{t('ui.home.popular')}</span>
                            {QUICK.map(q => (
                                <button key={q} type="button" onClick={() => runSearch(q)} className="chip">{q}</button>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 pb-16 pt-12 xl:px-0">
                    {isEmptySearch ? (
                        <>
                            <EmptyState
                                icon={Search}
                                title={fmt(t('ui.home.emptyTitle'), { query: activeSearch })}
                                text={t('ui.home.emptyText')}
                                action={<button onClick={() => runSearch('')} className="btn btn-secondary">{t('ui.home.resetSearch')}</button>}
                            />
                            {soon.length > 0 && (
                                <section className="flex flex-col gap-4">
                                    <SectionHeader title={t('ui.home.maybe')} subtitle={t('ui.home.maybeSubtitle')} />
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                        {soon.map(e => <EventCardCompact key={e.id} event={e} />)}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <>
                            {!activeSearch && soon.length > 0 && (
                                <section className="flex flex-col gap-4">
                                    <SectionHeader title={t('ui.home.soon')} subtitle={t('ui.home.soonSubtitle')} />
                                    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                                        {soon.map(e => (
                                            <div key={e.id} className="w-[260px] shrink-0 snap-start sm:w-auto">
                                                <EventCardCompact event={e} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="flex flex-col gap-5">
                                <SectionHeader
                                    title={activeSearch ? `${t('ui.home.resultsTitle')}: «${activeSearch}»` : t('ui.home.all')}
                                    subtitle={events ? fmt(t('ui.home.allSubtitle'), { count: events.totalCount }) : undefined}
                                    right={
                                        <div className="flex gap-2" role="group">
                                            <button className="chip" aria-pressed={status === 'Published'} onClick={() => changeStatus('Published')}>{t('ui.home.upcoming')}</button>
                                            <button className="chip" aria-pressed={status === 'Completed'} onClick={() => changeStatus('Completed')}>{t('ui.home.past')}</button>
                                        </div>
                                    }
                                />
                                {isLoading ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)}
                                    </div>
                                ) : events?.items.length === 0 ? (
                                    <EmptyState icon={Search} title={t('ui.home.emptyNoQuery')} />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {events?.items.map(e => <EventCard key={e.id} event={e} />)}
                                        </div>
                                        {events && (
                                            <Pagination
                                                page={events.page}
                                                totalPages={events.totalPages}
                                                hasNextPage={events.hasNextPage}
                                                hasPreviousPage={events.hasPreviousPage}
                                                onPageChange={(p) => fetchEvents(activeSearch, status, p)}
                                            />
                                        )}
                                    </>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
