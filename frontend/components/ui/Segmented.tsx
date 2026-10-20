import { LucideIcon } from 'lucide-react';

interface SegmentedProps<T extends string> {
    items: { value: T; label: string; icon?: LucideIcon }[];
    value: T;
    onChange: (value: T) => void;
    dark?: boolean;
    label: string;
}

export default function Segmented<T extends string>({ items, value, onChange, dark = false, label }: SegmentedProps<T>) {
    return (
        <div role="radiogroup" aria-label={label} className={`flex gap-1 rounded-[14px] p-1 ${dark ? 'bg-night-700' : 'bg-neutral-bg'}`}>
            {items.map(item => {
                const active = item.value === value;
                const Icon = item.icon;
                return (
                    <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(item.value)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3.5 py-2 text-sm transition-colors ${active ? 'bg-white font-semibold text-ink shadow-card' : `font-medium ${dark ? 'text-placeholder hover:text-white' : 'text-muted hover:text-ink'}`}`}
                    >
                        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
