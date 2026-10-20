'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, Search, Users } from 'lucide-react';
import { AdminUser, PagedResult } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate, userStatus } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<PagedResult<AdminUser> | null>(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [action, setAction] = useState<{ type: 'block' | 'unblock'; id: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const load = (s: string, page: number) => api.get<PagedResult<AdminUser>>('/admin/users', { params: { searchTerm: s || undefined, page, pageSize: 10 } })
        .then(r => setUsers(r.data)).catch(() => setError('Failed to load users.'));
    useEffect(() => { load('', 1); }, []);

    const doAction = async () => {
        if (!action) return;
        setBusy(true);
        try {
            await api.post(`/admin/users/${action.id}/${action.type}`);
            setUsers(prev => prev && { ...prev, items: prev.items.map(u => u.id === action.id ? { ...u, isBlocked: action.type === 'block' } : u) });
            setAction(null);
        } catch (err) {
            setError(apiError(err, 'Failed to update user.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppShell kind="admin">
            <PageHeader title={t('ui.admin.usersTitle')} subtitle={users ? fmt(t('ui.admin.usersSubtitle'), { count: users.totalCount }) : undefined} />
            <form onSubmit={(e) => { e.preventDefault(); load(search, 1); }} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" aria-hidden="true" />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('ui.admin.searchUsers')} aria-label={t('ui.admin.searchUsers')} className="input input-with-icon" />
            </form>
            {error && <Alert tone="danger">{error}</Alert>}
            {users === null ? (
                <div className="skeleton h-64" />
            ) : users.items.length === 0 ? (
                <div className="card"><EmptyState icon={Users} title={t('ui.admin.noResults')} /></div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('ui.admin.colUser')}</th>
                                <th>{t('ui.admin.colRole')}</th>
                                <th>{t('ui.admin.colJoined')}</th>
                                <th>{t('ui.admin.colStatus')}</th>
                                <th className="text-right">{t('ui.admin.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.items.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                                            <Avatar name={u.fullName} size="md" />
                                            <div>
                                                <p className="font-semibold hover:text-brand-600">{u.fullName}</p>
                                                <p className="text-xs font-medium text-subtle">{u.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td>{t(`ui.admin.roles.${u.role}`)}</td>
                                    <td className="whitespace-nowrap">{formatDate(u.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td><StatusBadge status={userStatus(u)} kind="user" /></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            {u.role !== 'Admin' && (u.isBlocked ? (
                                                <button onClick={() => setAction({ type: 'unblock', id: u.id, name: u.fullName })} className="btn btn-secondary btn-sm">{t('ui.admin.unblock')}</button>
                                            ) : (
                                                <button onClick={() => setAction({ type: 'block', id: u.id, name: u.fullName })} className="btn btn-ghost btn-sm"><Ban aria-hidden="true" />{t('ui.admin.block')}</button>
                                            ))}
                                            <Link href={`/admin/users/${u.id}`} className="btn btn-secondary btn-sm">{t('ui.admin.profile')}</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {users && <Pagination page={users.page} totalPages={users.totalPages} hasNextPage={users.hasNextPage} hasPreviousPage={users.hasPreviousPage} onPageChange={(p) => load(search, p)} />}
            {action && (
                <ConfirmDialog
                    danger={action.type === 'block'}
                    title={fmt(t(action.type === 'block' ? 'ui.admin.blockTitle' : 'ui.admin.unblockTitle'), { name: action.name })}
                    message={t(action.type === 'block' ? 'ui.admin.blockText' : 'ui.admin.unblockText')}
                    confirmLabel={action.type === 'block' ? t('ui.admin.block') : t('ui.admin.unblock')}
                    onConfirm={doAction}
                    onClose={() => setAction(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
