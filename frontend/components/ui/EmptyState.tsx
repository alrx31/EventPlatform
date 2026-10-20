import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    text?: string;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({ icon: Icon, title, text, action, className = '' }: EmptyStateProps) {
    return (
        <div className={`mx-auto flex max-w-[560px] flex-col items-center gap-3 px-8 py-12 text-center ${className}`} role="status">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-bg">
                <Icon className="h-7 w-7 text-subtle" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-semibold leading-[26px] text-ink">{title}</h3>
            {text && <p className="max-w-[400px] text-sm text-muted">{text}</p>}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
