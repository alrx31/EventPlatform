interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

export function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

export default function Avatar({ name, size = 'sm' }: AvatarProps) {
    const s = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-[72px] w-[72px] text-[22px]';
    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${s}`} aria-hidden="true">
            {initials(name)}
        </span>
    );
}
