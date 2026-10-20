interface ProgressBarProps {
    value: number;
    tone?: 'brand' | 'success';
    dark?: boolean;
    label?: string;
}

export default function ProgressBar({ value, tone = 'brand', dark = false, label }: ProgressBarProps) {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(v)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-night-700' : 'bg-neutral-bg'}`}
        >
            <div className={`h-full rounded-full ${tone === 'brand' ? 'bg-brand-600' : 'bg-success-solid'}`} style={{ width: `${v}%` }} />
        </div>
    );
}
