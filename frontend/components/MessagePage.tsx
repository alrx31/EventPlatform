'use client'

import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { goBack } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function MessagePage({ kind }: { kind: '404' | '403' }) {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main" className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
                {kind === '404' ? (
                    <p className="text-5xl font-bold leading-[56px] tracking-[-1.5px] text-brand-600">404</p>
                ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-warning-bg">
                        <Lock className="h-9 w-9 text-warning-fg" aria-hidden="true" />
                    </span>
                )}
                <h1 className="text-[32px] font-bold leading-10 tracking-tight text-ink">
                    {kind === '404' ? t('ui.message.notFoundTitle') : t('ui.message.deniedTitle')}
                </h1>
                <p className="text-[15px] text-muted">{kind === '404' ? t('ui.message.notFoundText') : t('ui.message.deniedText')}</p>
                <div className="flex gap-3">
                    <button onClick={() => goBack('/')} className="btn btn-secondary"><ArrowLeft aria-hidden="true" />{t('ui.message.back')}</button>
                    <Link href="/" className="btn btn-primary">{t('ui.message.home')}</Link>
                </div>
            </main>
        </div>
    );
}
