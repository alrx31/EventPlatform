'use client'

import { useTranslation } from '@/i18n';

type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const EVENT_TONES: Record<string, Tone> = {
    Published: 'success',
    UnderReview: 'warning',
    Draft: 'info',
    Rejected: 'danger',
    Cancelled: 'danger',
    Completed: 'neutral',
};

const TICKET_TONES: Record<string, Tone> = {
    Active: 'success',
    Used: 'info',
    Cancelled: 'danger',
};

const USER_TONES: Record<string, Tone> = {
    Active: 'success',
    Blocked: 'danger',
    Pending: 'warning',
};

export const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
    success: { badge: 'bg-success-bg text-success-fg', dot: 'bg-success-solid' },
    warning: { badge: 'bg-warning-bg text-warning-fg', dot: 'bg-warning-solid' },
    info: { badge: 'bg-info-bg text-info-fg', dot: 'bg-brand-600' },
    danger: { badge: 'bg-danger-bg text-danger-fg', dot: 'bg-danger-solid' },
    neutral: { badge: 'bg-neutral-bg text-neutral-fg', dot: 'bg-subtle' },
};

interface StatusBadgeProps {
    status: string;
    kind?: 'event' | 'ticket' | 'user';
    size?: 'sm' | 'md';
    label?: string;
}

export default function StatusBadge({ status, kind = 'event', size = 'sm', label }: StatusBadgeProps) {
    const { t } = useTranslation();
    const map = kind === 'ticket' ? TICKET_TONES : kind === 'user' ? USER_TONES : EVENT_TONES;
    const tone = map[status] ?? 'neutral';
    const text = label ?? t(`statusLabels.${kind}.${status}`);
    const cls = TONE_CLASSES[tone];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium text-xs leading-4 whitespace-nowrap ${size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'} ${cls.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} aria-hidden="true" />
            {text}
        </span>
    );
}
