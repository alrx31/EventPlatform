import Link from 'next/link';
import { EventSummary } from '@/types';
import DateBlock from '@/components/ui/DateBlock';

export default function EventCardCompact({ event }: { event: EventSummary }) {
    return (
        <Link href={`/events/${event.id}`} className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-card-hover">
            <DateBlock date={event.startDate} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{event.title}</p>
                <p className="truncate text-xs font-medium text-subtle">{event.location}</p>
            </div>
        </Link>
    );
}
