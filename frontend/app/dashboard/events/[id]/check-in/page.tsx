'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Check, CircleAlert, CircleCheck, CircleX, Keyboard, QrCode, X } from 'lucide-react';
import api from '@/lib/api';
import { EventDetail } from '@/types';
import Segmented from '@/components/ui/Segmented';
import ProgressBar from '@/components/ui/ProgressBar';
import { apiError, fmt } from '@/lib/utils';
import { useTranslation } from '@/i18n';

type Kind = 'ok' | 'used' | 'invalid' | 'forbidden';
interface Result { kind: Kind; code: string; name?: string; ticket?: string; at: Date; }

interface Detector { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (opts: { formats: string[] }) => Detector } }

const RESULT_STYLE: Record<Kind, { bg: string; icon: typeof CircleCheck }> = {
    ok: { bg: 'bg-success-solid', icon: CircleCheck },
    used: { bg: 'bg-warning-solid', icon: CircleAlert },
    invalid: { bg: 'bg-danger-solid', icon: CircleX },
    forbidden: { bg: 'bg-danger-solid', icon: CircleX },
};

export default function CheckInPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [mode, setMode] = useState<'camera' | 'manual'>('camera');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [history, setHistory] = useState<Result[]>([]);
    const [cameraFailed, setCameraFailed] = useState(false);
    const supported = useSyncExternalStore(
        () => () => {},
        () => !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia,
        () => false,
    );
    const cameraError = cameraFailed || !supported;
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const busyRef = useRef(false);

    useEffect(() => {
        api.get<EventDetail>(`/events/${id}`).then(r => setEvent(r.data)).catch(() => {});
    }, [id]);

    const check = useCallback(async (raw: string) => {
        const value = raw.trim();
        if (!value || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        let res: Result;
        try {
            const r = await api.post<{ attendeeName: string; ticketTypeName?: string }>('/registrations/check-in', { qrCode: value });
            res = { kind: 'ok', code: value, name: r.data.attendeeName, ticket: r.data.ticketTypeName, at: new Date() };
        } catch (err) {
            const msg = apiError(err, '').toLowerCase();
            const kind: Kind = msg.includes('already been used') ? 'used' : msg.includes('not authorized') ? 'forbidden' : 'invalid';
            res = { kind, code: value, at: new Date() };
        }
        setResult(res);
        setHistory(h => [res, ...h].slice(0, 5));
        setBusy(false);
        busyRef.current = false;
        if (navigator.vibrate) navigator.vibrate(res.kind === 'ok' ? 120 : [80, 60, 80]);
    }, []);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(tr => tr.stop());
        streamRef.current = null;
    };

    useEffect(() => {
        if (mode !== 'camera' || result || !supported || !window.BarcodeDetector) return;
        let cancelled = false;
        let timer: number | undefined;
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
            if (cancelled) { stream.getTracks().forEach(tr => tr.stop()); return; }
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
            const tick = async () => {
                if (cancelled || !videoRef.current) return;
                try {
                    const codes = await detector.detect(videoRef.current);
                    if (codes[0]?.rawValue) { await check(codes[0].rawValue); return; }
                } catch { }
                timer = window.setTimeout(tick, 350);
            };
            tick();
        }).catch(() => setCameraFailed(true));
        return () => { cancelled = true; window.clearTimeout(timer); stopCamera(); };
    }, [mode, result, check, supported]);

    const sold = event ? event.ticketTypes.reduce((s, tt) => s + tt.totalQuantity - tt.availableQuantity, 0) : 0;
    const checked = history.filter(h => h.kind === 'ok').length;

    if (result) {
        const st = RESULT_STYLE[result.kind];
        const Icon = st.icon;
        const title = { ok: t('ui.checkin.okTitle'), used: t('ui.checkin.usedTitle'), invalid: t('ui.checkin.invalidTitle'), forbidden: t('ui.checkin.forbiddenTitle') }[result.kind];
        const sub = { ok: t('ui.checkin.okSub'), used: t('ui.checkin.usedSub'), invalid: t('ui.checkin.invalidSub'), forbidden: t('ui.checkin.forbiddenSub') }[result.kind];
        const rows = result.kind === 'ok'
            ? [[t('ui.checkin.guest'), result.name ?? '—'], [t('ui.checkin.ticket'), result.ticket ?? '—'], [t('ui.checkin.event'), event?.title ?? '—']]
            : [[t('ui.checkin.codeLabel'), result.code.length > 16 ? `${result.code.slice(0, 16)}…` : result.code], [t('ui.checkin.what'), t('ui.checkin.whatText')]];
        const next = () => { setResult(null); setCode(''); };
        return (
            <main id="main" className={`flex min-h-screen flex-col text-white ${st.bg}`} role="alert">
                <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
                    <div className="px-4 py-3">
                        <button onClick={next} aria-label={t('close')} className="btn btn-icon text-white hover:bg-white/15"><X /></button>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-5 px-6 pb-6 pt-10 text-center">
                        <span className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white/20">
                            <Icon className="h-16 w-16" aria-hidden="true" />
                        </span>
                        <h1 className="text-[40px] font-bold leading-[48px] tracking-[-1px]">{title}</h1>
                        <p className="text-[17px] text-white/85">{sub}</p>
                        <dl className="flex w-full flex-col gap-3.5 rounded-[20px] bg-white/15 p-5 text-left">
                            {rows.map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-xs font-medium text-white/75">{k}</dt>
                                    <dd className="text-lg font-semibold leading-[26px]">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <div className="flex flex-col gap-3 px-4 pb-8">
                        <button onClick={next} autoFocus className="btn btn-secondary btn-lg w-full border-transparent">
                            {result.kind === 'ok' ? t('ui.checkin.next') : result.kind === 'used' ? t('ui.checkin.continue') : t('ui.checkin.retry')}
                        </button>
                        {result.kind === 'ok' && <Link href={`/dashboard/events/${id}/manage`} className="py-2 text-center text-sm font-semibold">{t('ui.checkin.backToEvent')}</Link>}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main id="main" className="min-h-screen bg-night-900 text-white">
            <div className="mx-auto flex max-w-[420px] flex-col">
                <header className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link href={`/dashboard/events/${id}/manage`} aria-label={t('back')} className="btn btn-icon bg-night-700 text-white hover:bg-night-800"><ArrowLeft /></Link>
                    <div className="min-w-0 text-center">
                        <p className="caps-label text-placeholder">{t('ui.checkin.title')}</p>
                        <p className="truncate text-sm font-semibold">{event?.title ?? '…'}</p>
                    </div>
                    <span className="w-10" />
                </header>
                <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">{fmt(t('ui.checkin.session'), { count: checked })}</span>
                        <span className="font-semibold text-success-border">{fmt(t('ui.checkin.sold'), { count: sold })}</span>
                    </div>
                    <ProgressBar value={sold ? (checked / sold) * 100 : 0} tone="success" dark />
                </div>
                <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
                    <Segmented
                        dark
                        label={t('ui.checkin.title')}
                        value={mode}
                        onChange={setMode}
                        items={[{ value: 'camera', label: t('ui.checkin.camera'), icon: Camera }, { value: 'manual', label: t('ui.checkin.manual'), icon: Keyboard }]}
                    />
                    {mode === 'camera' ? (
                        <>
                            <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-night-700 to-night-900">
                                {!cameraError && <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
                                {cameraError && <QrCode className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 text-white/20" aria-hidden="true" />}
                                {['left-12 top-12 border-l-4 border-t-4', 'right-12 top-12 border-r-4 border-t-4', 'left-12 bottom-12 border-b-4 border-l-4', 'right-12 bottom-12 border-b-4 border-r-4'].map(c => (
                                    <span key={c} className={`absolute h-11 w-11 rounded-sm border-white ${c}`} aria-hidden="true" />
                                ))}
                                {!cameraError && <span className="absolute left-14 right-14 top-1/2 h-[3px] rounded-full bg-success-solid shadow-[0_0_12px_rgba(22,163,74,0.8)]" aria-hidden="true" />}
                            </div>
                            <p className="text-center text-sm text-placeholder">{cameraError ? t('ui.checkin.noCamera') : t('ui.checkin.aim')}</p>
                        </>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); check(code); }} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="code" className="text-sm font-medium text-placeholder">{t('ui.checkin.code')}</label>
                                <div className="flex h-14 items-center gap-2.5 rounded-[10px] border border-brand-500 bg-night-800 px-4">
                                    <QrCode className="h-5 w-5 text-placeholder" aria-hidden="true" />
                                    <input id="code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="7f3c9a2e-41b8-4d5e-…" className="min-w-0 flex-1 bg-transparent font-mono text-[13px] font-medium tracking-wide text-white outline-none placeholder:text-placeholder" />
                                </div>
                                <p className="text-xs font-medium text-placeholder">{t('ui.checkin.codeHint')}</p>
                            </div>
                            <button type="submit" disabled={busy || !code.trim()} className="btn btn-primary btn-lg w-full"><Check aria-hidden="true" />{t('ui.checkin.check')}</button>
                        </form>
                    )}
                    {history.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <p className="caps-label text-placeholder">{t('ui.checkin.recent')}</p>
                            {history.map((h, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-[10px] bg-night-800 p-3">
                                    {h.kind === 'ok' ? <CircleCheck className="h-5 w-5 text-success-solid" /> : <CircleAlert className="h-5 w-5 text-warning-solid" />}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{h.name ?? h.code}</p>
                                        <p className={`text-xs font-medium ${h.kind === 'ok' ? 'text-placeholder' : 'text-warning-border'}`}>
                                            {h.kind === 'ok' ? h.ticket : h.kind === 'used' ? t('ui.checkin.usedTitle') : t('ui.checkin.invalidTitle')}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-placeholder">{h.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
