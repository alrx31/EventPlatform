const PALETTES = [
    ['#2557e8', '#7c3aed'],
    ['#f97316', '#db2777'],
    ['#0d9488', '#2557e8'],
    ['#7c3aed', '#db2777'],
    ['#0f172a', '#1d46c4'],
    ['#16a34a', '#0d9488'],
];

function hash(value: string) {
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
    return h;
}

interface EventCoverProps {
    seed: string;
    date?: string;
    imageUrl?: string | null;
    className?: string;
    showDate?: boolean;
}

export default function EventCover({ seed, date, imageUrl, className = '', showDate = true }: EventCoverProps) {
    const h = hash(seed);
    const [c1, c2] = PALETTES[h % PALETTES.length];
    const d = date ? new Date(date) : null;
    const locale = typeof window !== 'undefined' && localStorage.getItem('language') === 'en' ? 'en-US' : 'ru-RU';

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={imageUrl ? undefined : { backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
            aria-hidden="true"
        >
            {imageUrl ? (
                <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
                <>
                    <span className="absolute -left-10 top-1/3 h-48 w-48 rounded-full bg-white/10" />
                    <span className="absolute left-1/3 -top-16 h-40 w-40 rounded-full bg-white/10" />
                    <span className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-2 border-white/25" />
                    <span className="absolute right-6 -bottom-20 h-44 w-44 rounded-full bg-white/[0.08]" />
                </>
            )}
            {showDate && d && (
                <span className="absolute left-4 top-4 flex flex-col items-center rounded-[10px] bg-white px-3 py-1.5 shadow-card">
                    <span className="text-lg font-semibold leading-6 text-ink">{d.getDate()}</span>
                    <span className="caps-label text-accent-600">{d.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span>
                </span>
            )}
        </div>
    );
}
