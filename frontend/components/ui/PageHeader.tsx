import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    before?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions, before }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1.5">
                {before}
                <h1 className="text-[26px] font-bold leading-8 tracking-tight text-ink sm:text-[32px] sm:leading-10">{title}</h1>
                {subtitle && <p className="text-[15px] leading-6 text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
}
