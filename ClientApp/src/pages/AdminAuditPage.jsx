import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const ACTION_KEYS = {
    Delete: 'admin_audit_action_delete',
    'Delete (FAILED)': 'admin_audit_action_delete_failed',
    DeleteComment: 'admin_audit_action_delete_comment',
    Reject: 'admin_audit_action_reject',
    Create: 'admin_audit_action_create',
    Update: 'admin_audit_action_update',
    Approve: 'admin_audit_action_approve',
    AddComment: 'admin_audit_action_add_comment'
};

export default function AdminAuditPage() {
    const { t } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoaded(false);
        api.get('/audit', { params: { all: showAll } })
            .then((res) => {
                if (active) setEntries(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => {
                if (active) setError(t('admin_audit_error'));
            })
            .finally(() => {
                if (active) setLoaded(true);
            });
        return () => { active = false; };
    }, [showAll, t]);

    const labelFor = (action) => {
        const key = ACTION_KEYS[action];
        return key ? t(key) : action;
    };

    return (
        <div className="admin-articles">
            <h1>{t('admin_audit_title')}</h1>
            <p className="encyclopedia-intro">{t('admin_audit_intro')}</p>
            <label className="admin-audit-toggle">
                <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(event) => setShowAll(event.target.checked)}
                />
                {t('admin_audit_show_all')}
            </label>
            {error && <p className="admin-articles-error">{error}</p>}
            {loaded && entries.length === 0 && <p>{t(showAll ? 'admin_audit_empty_all' : 'admin_audit_empty')}</p>}
            <ul className="admin-articles-list">
                {entries.map((entry) => (
                    <li key={entry.id}>
                        <div>
                            <strong>{labelFor(entry.action)}</strong>
                            <span>{entry.actorName || `#${entry.userId}`}</span>
                            <span>{entry.details}</span>
                        </div>
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
