'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';
import AuthShell from '@/components/AuthShell';
import Alert from '@/components/ui/Alert';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError(null);
        try {
            await login(data.email, data.password);
            if (document.referrer && new URL(document.referrer).origin === location.origin && !document.referrer.includes('/auth/')) router.back();
            else router.push('/');
        } catch {
            setError(t('auth.invalidCredentials'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell title={t('ui.auth.loginTitle')} subtitle={t('ui.auth.loginSubtitle')}>
            {error && <Alert tone="danger">{error}</Alert>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                <div>
                    <label className="label" htmlFor="email">{t('auth.email')}</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                        <input id="email" {...register('email')} aria-invalid={!!errors.email} autoComplete="email" type="email" className="input input-with-icon" placeholder="you@example.com" />
                    </div>
                    {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="password">{t('auth.password')}</label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                        <input id="password" {...register('password')} aria-invalid={!!errors.password} autoComplete="current-password" type="password" className="input input-with-icon" placeholder="••••••••" />
                    </div>
                    {errors.password && <p className="field-error" role="alert">{errors.password.message}</p>}
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                </button>
            </form>
            <p className="text-center text-sm text-muted">
                {t('ui.auth.noAccount')}{' '}
                <Link href="/auth/register" className="font-semibold text-brand-600 hover:underline">{t('ui.auth.signUp')}</Link>
            </p>
        </AuthShell>
    );
}
