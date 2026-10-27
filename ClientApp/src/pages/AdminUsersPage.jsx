import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = () => {
        api.get('/users/admin')
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError(t('admin_users_error')))
            .finally(() => setLoaded(true));
    };

    useEffect(() => { load(); }, []);

    const adminCount = users.filter((person) => person.role === 'Admin').length;

    const changeRole = async (person, role) => {
        if (role === 'User' && !window.confirm(t('admin_users_confirm_remove', { name: person.displayName || person.email }))) {
            return;
        }
        setError('');
        setStatus('');
        setBusyId(person.id);
        try {
            await api.put(`/users/${person.id}/role`, { role });
            setStatus(role === 'Admin'
                ? t('admin_users_promoted', { name: person.displayName || person.email })
                : t('admin_users_demoted', { name: person.displayName || person.email }));
            load();
        } catch (err) {
            setError(err.response?.data?.error || t('admin_users_error'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="admin-articles">
            <h1>{t('admin_users_title')}</h1>
            <p className="encyclopedia-intro">{t('admin_users_intro')}</p>
            {status && <p className="admin-articles-ok">{status}</p>}
            {error && <p className="admin-articles-error">{error}</p>}
            {loaded && users.length === 0 && <p>{t('admin_users_empty')}</p>}
            <ul className="admin-articles-list">
                {users.map((person) => {
                    const isAdmin = person.role === 'Admin';
                    const isSelf = currentUser?.id === person.id;
                    const canRemove = isAdmin && adminCount > 1;
                    return (
                        <li key={person.id}>
                            <div>
                                <strong>{person.displayName || person.email}</strong>
                                <span>{person.email}</span>
                                <span>
                                    {isAdmin ? t('admin_users_role_admin') : t('admin_users_role_user')}
                                    {isSelf ? ` · ${t('admin_users_you')}` : ''}
                                    {!person.emailConfirmed ? ` · ${t('admin_users_unconfirmed')}` : ''}
                                </span>
                            </div>
                            <div className="admin-articles-actions">
                                {!isAdmin && (
                                    <button type="button" disabled={busyId === person.id} onClick={() => changeRole(person, 'Admin')}>
                                        {t('admin_users_promote')}
                                    </button>
                                )}
                                {canRemove && (
                                    <button type="button" disabled={busyId === person.id} onClick={() => changeRole(person, 'User')}>
                                        {t('admin_users_demote')}
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
