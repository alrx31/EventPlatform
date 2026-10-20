'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarPlus, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';
import AuthShell from '@/components/AuthShell';
import Alert from '@/components/ui/Alert';
import Segmented from '@/components/ui/Segmented';

const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['User', 'Organizer']),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'User' },
    });
    const role = watch('role');

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError(null);
        try {
            await registerUser(data.email, data.password, data.firstName, data.lastName, data.role);
            router.push('/');
        } catch {
            setError(t('auth.registrationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const iconInput = (name: 'email' | 'password' | 'confirmPassword', Icon: typeof Mail, type: string, autoComplete: string, placeholder: string) => (
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
            <input id={name} {...register(name)} aria-invalid={!!errors[name]} type={type} autoComplete={autoComplete} placeholder={placeholder} className="input input-with-icon" />
        </div>
    );

    return (
        <AuthShell title={t('ui.auth.registerTitle')} subtitle={t('ui.auth.registerSubtitle')}>
            {error && <Alert tone="danger">{error}</Alert>}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]" noValidate>
                <Segmented
                    label={t('auth.accountType')}
                    value={role}
                    onChange={(v) => setValue('role', v)}
                    items={[
                        { value: 'User', label: t('ui.auth.attendee'), icon: User },
                        { value: 'Organizer', label: t('ui.auth.organizer'), icon: CalendarPlus },
                    ]}
                />
                {role === 'Organizer' && <Alert tone="warning">{t('ui.auth.organizerHint')}</Alert>}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label" htmlFor="firstName">{t('auth.firstName')}</label>
                        <input id="firstName" {...register('firstName')} aria-invalid={!!errors.firstName} autoComplete="given-name" className="input" />
                        {errors.firstName && <p className="field-error" role="alert">{errors.firstName.message}</p>}
                    </div>
                    <div>
                        <label className="label" htmlFor="lastName">{t('auth.lastName')}</label>
                        <input id="lastName" {...register('lastName')} aria-invalid={!!errors.lastName} autoComplete="family-name" className="input" />
                        {errors.lastName && <p className="field-error" role="alert">{errors.lastName.message}</p>}
                    </div>
                </div>
                <div>
                    <label className="label" htmlFor="email">{t('auth.email')}</label>
                    {iconInput('email', Mail, 'email', 'email', 'you@example.com')}
                    {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="password">{t('auth.password')}</label>
                    {iconInput('password', Lock, 'password', 'new-password', '••••••••')}
                    {errors.password ? <p className="field-error" role="alert">{errors.password.message}</p> : <p className="field-hint">{t('ui.auth.passwordHint')}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
                    {iconInput('confirmPassword', Lock, 'password', 'new-password', '••••••••')}
                    {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword.message}</p>}
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
                    {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                </button>
            </form>
            <p className="text-center text-sm text-muted">
                {t('ui.auth.haveAccount')}{' '}
                <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">{t('auth.signIn')}</Link>
            </p>
        </AuthShell>
    );
}
