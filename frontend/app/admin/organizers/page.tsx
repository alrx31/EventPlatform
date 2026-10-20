'use client'

import { useEffect, useState } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { PagedResult, PendingOrganizer } from '@/types';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import Alert from '@/components/ui/Alert';
import { apiError, fmt, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function AdminOrganizersPage() {
    const { t } = useTranslation();
    const [orgs, setOrgs] = useState<PagedResult<PendingOrganizer> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [action, setAction] = useState<{ type: 'approve' | 'reject'; id: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const load = (page: number) => api.get<PagedResult<PendingOrganizer>>('/admin/organizers/pending', { params: { page, pageSize: 10 } })
        .then(r => setOrgs(r.data)).catch(() => setError('Failed to load organizers.'));
    useEffect(() => { load(1); }, []);

    const doAction = async () => {
        if (!action) return;
        setBusy(true);
        try {
            await api.post(`/admin/organizers/${action.id}/${action.type}`);
            setAction(null);
            await load(orgs?.page ?? 1);
        } catch (err) {
            setError(apiError(err, 'Failed to process request.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppShell kind="admin">
            <PageHeader title={t('ui.admin.orgsTitle')} subtitle={t('ui.admin.orgsSubtitle')} />
            <Alert tone="info" title={t('ui.admin.orgsNoteTitle')}>{t('ui.admin.orgsNoteText')}</Alert>
            {error && <Alert tone="danger">{error}</Alert>}
            {orgs === null ? (
                <div className="skeleton h-48" />
            ) : orgs.items.length === 0 ? (
                <div className="card"><EmptyState icon={UserPlus} title={t('ui.admin.orgsEmpty')} /></div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('ui.admin.colUser')}</th>
                                <th>{t('ui.admin.colRequested')}</th>
                                <th>{t('ui.admin.colStatus')}</th>
                                <th className="text-right">{t('ui.admin.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.items.map(o => (
                                <tr key={o.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Avatar name={o.fullName} size="md" />
                                            <div>
                                                <p className="font-semibold">{o.fullName}</p>
                                                <p className="text-xs font-medium text-subtle">{o.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatDate(o.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td><StatusBadge status="Pending" kind="user" /></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setAction({ type: 'reject', id: o.id, name: o.fullName })} className="btn btn-secondary btn-sm"><X aria-hidden="true" />{t('ui.admin.reject')}</button>
                                            <button onClick={() => setAction({ type: 'approve', id: o.id, name: o.fullName })} className="btn btn-primary btn-sm"><Check aria-hidden="true" />{t('ui.admin.approve')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {orgs && <Pagination page={orgs.page} totalPages={orgs.totalPages} hasNextPage={orgs.hasNextPage} hasPreviousPage={orgs.hasPreviousPage} onPageChange={load} />}
            {action && (
                <ConfirmDialog
                    danger={action.type === 'reject'}
                    title={fmt(t(action.type === 'approve' ? 'ui.admin.approveOrgTitle' : 'ui.admin.rejectOrgTitle'), { name: action.name })}
                    message={t(action.type === 'approve' ? 'ui.admin.approveOrgText' : 'ui.admin.rejectOrgText')}
                    confirmLabel={action.type === 'approve' ? t('ui.admin.approve') : t('ui.admin.reject')}
                    onConfirm={doAction}
                    onClose={() => setAction(null)}
                    isLoading={busy}
                />
            )}
        </AppShell>
    );
}
