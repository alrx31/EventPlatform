'use client'

import { CircleAlert, CircleCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTranslation } from '@/i18n';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    isLoading?: boolean;
    danger?: boolean;
}

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose, isLoading = false, danger = false }: ConfirmDialogProps) {
    const { t } = useTranslation();
    const Icon = danger ? CircleAlert : CircleCheck;

    return (
        <Modal onClose={onClose} label={title} width="max-w-[440px]">
            <div className="flex flex-col gap-5 p-6">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${danger ? 'bg-danger-bg text-danger-fg' : 'bg-info-bg text-info-fg'}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{title}</h2>
                    <p className="text-sm text-muted">{message}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="btn btn-secondary">{t('cancel')}</button>
                    <button onClick={onConfirm} disabled={isLoading} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>
                        {isLoading ? t('dialog.processing') : (confirmLabel || t('dialog.confirm'))}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
