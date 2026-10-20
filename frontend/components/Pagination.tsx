'use client'

import { useTranslation } from '@/i18n';

interface PaginationProps {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, hasNextPage, hasPreviousPage, onPageChange }: PaginationProps) {
    const { t } = useTranslation();
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const from = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let p = from; p <= Math.min(totalPages, from + 4); p++) pages.push(p);

    return (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
            <button onClick={() => onPageChange(page - 1)} disabled={!hasPreviousPage} className="btn btn-secondary btn-sm">
                {t('pagination.previous')}
            </button>
            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-[10px] text-sm font-semibold ${p === page ? 'bg-brand-600 text-white' : 'text-muted hover:bg-neutral-bg'}`}
                >
                    {p}
                </button>
            ))}
            <button onClick={() => onPageChange(page + 1)} disabled={!hasNextPage} className="btn btn-secondary btn-sm">
                {t('pagination.next')}
            </button>
        </nav>
    );
}
