import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n';

export const metadata: Metadata = {
    title: 'Event Platform',
    description: 'Discover and manage events',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen">
                <I18nProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </I18nProvider>
            </body>
        </html>
    );
}