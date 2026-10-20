'use client'

import { CalendarCheck, Globe, ShieldCheck, Ticket } from 'lucide-react';
import Logo from '@/components/Logo';
import { useTranslation } from '@/i18n';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    const { t, language, setLanguage } = useTranslation();
    const benefits = [
        { icon: Ticket, text: t('ui.auth.benefitQr') },
        { icon: ShieldCheck, text: t('ui.auth.benefitPay') },
        { icon: CalendarCheck, text: t('ui.auth.benefitOrg') },
    ];

    return (
        <div className="flex min-h-screen">
            <aside className="hidden w-[600px] shrink-0 flex-col justify-between bg-gradient-to-br from-brand-900 to-brand-600 p-16 lg:flex">
                <Logo dark />
                <div className="flex flex-col gap-6">
                    <h2 className="text-[32px] font-bold leading-10 tracking-tight text-white">{t('ui.auth.pitch')}</h2>
                    <p className="text-[17px] leading-[26px] text-white/80">{t('ui.auth.pitchText')}</p>
                    <ul className="flex flex-col gap-4">
                        {benefits.map(b => (
                            <li key={b.text} className="flex items-center gap-3 text-sm font-medium text-white">
                                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15">
                                    <b.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                                </span>
                                {b.text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs font-medium text-white/60">© 2026 EventPlatform</p>
            </aside>
            <main id="main" className="relative flex flex-1 items-center justify-center bg-white px-4 py-12 sm:p-12">
                <div className="absolute left-4 top-4 lg:hidden"><Logo /></div>
                <button
                    onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
                    aria-label={t('events.switchLanguage')}
                    className="absolute right-4 top-4 flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-sm font-medium text-muted hover:text-ink"
                >
                    <Globe className="h-4 w-4 text-subtle" aria-hidden="true" />
                    {language.toUpperCase()}
                </button>
                <div className="flex w-full max-w-[420px] flex-col gap-5 pt-10 lg:pt-0">
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-[32px] font-bold leading-10 tracking-tight text-ink">{title}</h1>
                        {subtitle && <p className="text-[15px] leading-6 text-muted">{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
