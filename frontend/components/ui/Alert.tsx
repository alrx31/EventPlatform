import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'info' | 'danger';

const STYLES: Record<Tone, string> = {
    success: 'bg-success-bg border-success-border text-success-fg',
    warning: 'bg-warning-bg border-warning-border text-warning-fg',
    info: 'bg-info-bg border-info-border text-info-fg',
    danger: 'bg-danger-bg border-danger-border text-danger-fg',
};

const ICONS = { success: CircleCheck, warning: CircleAlert, info: Info, danger: CircleX };

interface AlertProps {
    tone: Tone;
    title?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export default function Alert({ tone, title, children, action, className = '' }: AlertProps) {
    const Icon = ICONS[tone];
    return (
        <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-[10px] border px-4 py-3.5 ${STYLES[tone]} ${className}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-sm">
                {title && <p className="font-semibold">{title}</p>}
                {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
