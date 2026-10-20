import { LucideIcon } from 'lucide-react';

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
    default: 'bg-neutral-bg text-neutral-fg',
    brand: 'bg-info-bg text-info-fg',
    success: 'bg-success-bg text-success-fg',
    warning: 'bg-warning-bg text-warning-fg',
    danger: 'bg-danger-bg text-danger-fg',
};

interface StatCardProps {
    label: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    tone?: Tone;
}

export default function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: StatCardProps) {
    return (
        <div className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${TONES[tone]}`}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
            </div>
            <p className="text-[30px] font-bold leading-9 tracking-tight text-ink">{value}</p>
            {hint && <p className={`text-xs font-medium ${tone === 'danger' ? 'text-danger-fg' : 'text-subtle'}`}>{hint}</p>}
        </div>
    );
}
