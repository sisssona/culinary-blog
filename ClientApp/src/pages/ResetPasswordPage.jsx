import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError(t('passwords_mismatch') || 'Паролите не съвпадат.');
            return;
        }

        if (password.length < 8) {
            setError(t('password_min_8') || 'Паролата трябва да бъде поне 8 символа.');
            return;
        }

        if (!token) {
            setError(t('reset_token_missing') || 'Липсва или е невалиден токен за възстановяване.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setSuccess(true);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error || data?.message || t('reset_failed') || 'Неуспешно задаване на нова парола.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '2rem' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{t('reset_password_title') || 'Нова парола'}</h2>

                {success ? (
                    <div>
                        <p style={{ color: 'green', marginBottom: '20px', textAlign: 'center' }}>
                            {t('reset_password_success') || 'Паролата ви беше променена успешно! Вече можете да влезете с новата парола.'}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn green"
                            style={{ width: '100%' }}
                        >
                            {t('back_to_login') || 'Към Вход'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>{t('password_label') || 'Нова парола:'}</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>{t('confirm_password_label') || 'Повтори нова парола:'}</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn blue" style={{ width: '100%' }}>
                            {loading ? (t('saving') || 'Запазване...') : (t('save_new_password') || 'Запази новата парола')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
