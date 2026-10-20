interface DateBlockProps {
    date: string;
    muted?: boolean;
    size?: 'sm' | 'md';
}

export default function DateBlock({ date, muted = false, size = 'md' }: DateBlockProps) {
    const d = new Date(date);
    const locale = typeof window !== 'undefined' && localStorage.getItem('language') === 'en' ? 'en-US' : 'ru-RU';
    return (
        <div className={`flex shrink-0 flex-col items-center justify-center rounded-[10px] ${size === 'md' ? 'h-16 w-16' : 'h-14 w-14'} ${muted ? 'bg-neutral-bg' : 'bg-brand-50'}`}>
            <span className={`font-semibold ${size === 'md' ? 'text-[22px] leading-[30px]' : 'text-lg leading-6'} ${muted ? 'text-subtle' : 'text-brand-700'}`}>{d.getDate()}</span>
            <span className={`caps-label ${muted ? 'text-subtle' : 'text-brand-600'}`}>{d.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span>
        </div>
    );
}
