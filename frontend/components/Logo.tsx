import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';

export default function Logo({ dark = false, label }: { dark?: boolean; label?: string }) {
    return (
        <Link href="/" aria-label={label} className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-600 text-white">
                <CalendarCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className={`text-lg font-semibold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>EventPlatform</span>
        </Link>
    );
}
