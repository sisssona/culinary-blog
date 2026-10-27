import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AccountPage() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [confirmEmail, setConfirmEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const emailMatches = user?.email && confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

    const deleteAccount = async () => {
        if (!emailMatches) return;
        setBusy(true);
        setError('');
        try {
            await api.delete('/auth/delete-account');
            logout();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || t('account_delete_error'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="legal-page">
            <h1>{t('account_title')}</h1>
            <dl className="account-facts">
                <div>
                    <dt>{t('account_name_label')}</dt>
                    <dd>{user?.displayName}</dd>
                </div>
                <div>
                    <dt>{t('email_label')}</dt>
                    <dd>{user?.email}</dd>
                </div>
            </dl>
            <p>
                <Link to="/my-recipes">{t('menu_my_recipes')}</Link>
            </p>

            <section className="account-danger">
                <h2>{t('danger_zone_title')}</h2>
                <p>{t('account_delete_help')}</p>
                <label>
                    {t('account_delete_type')}
                    <input
                        type="email"
                        value={confirmEmail}
                        onChange={(event) => setConfirmEmail(event.target.value)}
                        autoComplete="off"
                    />
                </label>
                {error && <p className="admin-articles-error">{error}</p>}
                <button type="button" className="btn red" disabled={!emailMatches || busy} onClick={deleteAccount}>
                    {busy ? t('deleting') : t('delete_account_btn')}
                </button>
            </section>
        </div>
    );
}
