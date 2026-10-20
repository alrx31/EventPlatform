'use client'

import { useState } from 'react';
import { CreditCard, Lock, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { useTranslation } from '@/i18n';
import { fmt, money } from '@/lib/utils';

interface PaymentModalProps {
    amount: number;
    ticketName: string;
    eventTitle: string;
    eventId: string;
    ticketTypeId: string;
    onSuccess: () => void;
    onClose: () => void;
}

export default function PaymentModal({ amount, ticketName, eventTitle, eventId, ticketTypeId, onSuccess, onClose }: PaymentModalProps) {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [error, setError] = useState<string | null>(null);

    const formatCardNumber = (value: string) => value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        return digits.length >= 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (cardNumber.replace(/\s/g, '').length < 16) return setError(t('ui.payment.errCard'));
        if (expiry.length < 5) return setError(t('ui.payment.errExpiry'));
        if (cvc.length < 3) return setError(t('ui.payment.errCvc'));

        setIsProcessing(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5220';
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
            const intentResponse = await fetch(`${apiUrl}/api/registrations/payment-intent`, {
                method: 'POST', headers, body: JSON.stringify({ eventId, ticketTypeId }),
            });
            if (!intentResponse.ok) {
                const data = await intentResponse.json().catch(() => ({}));
                throw new Error(data.error || t('payment.paymentFailed'));
            }
            const { clientSecret } = await intentResponse.json();
            const confirmResponse = await fetch(`${apiUrl}/api/payments/confirm`, {
                method: 'POST', headers, body: JSON.stringify({ clientSecret }),
            });
            if (!confirmResponse.ok) throw new Error(t('payment.paymentFailed'));
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('payment.paymentFailed'));
            setIsProcessing(false);
        }
    };

    const price = `$${money(amount)}`;

    return (
        <Modal onClose={isProcessing ? () => {} : onClose} label={t('ui.payment.title')}>
            <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-3 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-50">
                            <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
                        </span>
                        <h2 className="text-[22px] font-semibold leading-[30px] text-ink">{t('ui.payment.title')}</h2>
                    </div>
                    {!isProcessing && (
                        <button type="button" onClick={onClose} aria-label={t('close')} className="btn btn-ghost btn-icon">
                            <X />
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-4 px-6 pb-2">
                    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface p-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{eventTitle}</p>
                            <p className="text-xs font-medium text-subtle">{fmt(t('ui.payment.ticketLine'), { ticket: ticketName })}</p>
                        </div>
                        <p className="text-[22px] font-semibold text-ink">{price}</p>
                    </div>

                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
                            <span className="h-14 w-14 animate-spin rounded-full border-[5px] border-brand-100 border-t-brand-600" aria-hidden="true" />
                            <p className="text-lg font-semibold text-ink">{t('ui.payment.processingTitle')}</p>
                            <p className="text-sm text-muted">{t('ui.payment.processingText')}</p>
                        </div>
                    ) : (
                        <>
                            <Alert tone="info" title={t('ui.payment.testTitle')}>{t('ui.payment.testText')}</Alert>
                            {error && <Alert tone="danger">{error}</Alert>}
                            <div>
                                <label className="label" htmlFor="card">{t('ui.payment.card')}</label>
                                <div className="relative">
                                    <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                                    <input id="card" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" className="input input-with-icon" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label" htmlFor="exp">{t('ui.payment.expiry')}</label>
                                    <input id="exp" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="input" />
                                </div>
                                <div>
                                    <label className="label" htmlFor="cvc">{t('ui.payment.cvc')}</label>
                                    <input id="cvc" inputMode="numeric" autoComplete="cc-csc" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="123" className="input" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col items-center gap-3 p-6">
                    <button type="submit" disabled={isProcessing} className="btn btn-primary btn-lg w-full">
                        <Lock aria-hidden="true" />
                        {isProcessing ? t('ui.payment.processingButton') : fmt(t('ui.payment.pay'), { amount: money(amount) })}
                    </button>
                    <p className="text-center text-xs font-medium text-subtle">{t('ui.payment.secured')}</p>
                </div>
            </form>
        </Modal>
    );
}
