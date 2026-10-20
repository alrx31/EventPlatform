'use client'

import Logo from '@/components/Logo';
import { useTranslation } from '@/i18n';

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="border-t border-line bg-white">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between xl:px-0">
                <div className="flex items-center gap-4">
                    <Logo />
                    <span className="text-xs font-medium text-subtle">© 2026 EventPlatform</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
                    <span>{t('ui.footer.organizers')}</span>
                    <span>{t('ui.footer.help')}</span>
                    <span>{t('ui.footer.terms')}</span>
                    <span>{t('ui.footer.privacy')}</span>
                </div>
            </div>
        </footer>
    );
}
