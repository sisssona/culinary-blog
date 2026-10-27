import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import GoogleSignIn from './GoogleSignIn';

const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid var(--border, #ccc)',
    boxSizing: 'border-box',
    background: 'var(--bg, #fff)',
    color: 'var(--text-h, #222)'
};
const passwordInputStyle = { ...inputStyle, padding: '8px 38px 8px 8px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-h, #222)' };
const eyeButtonStyle = {
    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0
};
const alertBase = { padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' };

function PasswordField({ label, value, onChange, autoComplete, minLength, hint, marginBottom = '12px' }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <div style={{ marginBottom }}>
            <label style={labelStyle}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    required
                    minLength={minLength}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={passwordInputStyle}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? t('hide_password', 'Скрий паролата') : t('show_password', 'Покажи паролата')}
                    style={eyeButtonStyle}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
            {hint && (
                <small style={{ color: 'var(--text, #666)', fontSize: '0.75rem', display: 'block', marginTop: '3px' }}>
                    {hint}
                </small>
            )}
        </div>
    );
}

export default function LoginModal({ isOpen, onClose }) {
    const { login, register } = useAuth();
    const { t, i18n } = useTranslation();

    const [activeTab, setActiveTab] = useState('login');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regDisplayName, setRegDisplayName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regIsSubscribed, setRegIsSubscribed] = useState(false);

    const [forgotEmail, setForgotEmail] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('login');
            setLoginEmail('');
            setLoginPassword('');
            setRegDisplayName('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');
            setRegIsSubscribed(false);
            setForgotEmail('');
            setError('');
            setSuccessMessage('');
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const switchTab = (tab) => {
        setActiveTab(tab);
        setError('');
        setSuccessMessage('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        const result = await login(loginEmail, loginPassword);
        setLoading(false);

        if (result.success) {
            onClose();
        } else {
            const serverKey = result.message;
            setError(t(serverKey, serverKey || t('login_failed', 'Грешка при вход.')));
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (regPassword !== regConfirmPassword) {
            setError(t('passwords_mismatch', 'Паролите не съвпадат.'));
            return;
        }

        setLoading(true);
        const result = await register(regEmail, regPassword, regDisplayName, regIsSubscribed);
        setLoading(false);

        if (result.success) {
            setSuccessMessage(t('reg_success_message', 'Успешна регистрация! Моля, проверете имейла си за потвърждение.'));
            setRegDisplayName('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');
        } else {
            const serverKey = result.message;
            setError(t(serverKey, serverKey || t('network_error', 'Възникна грешка. Моля, опитайте отново.')));
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            const language = (i18n.language || '').toLowerCase().startsWith('en') ? 'en' : 'bg';
            await api.post('/auth/forgot-password', { email: forgotEmail, preferredLanguage: language });
            setSuccessMessage(t('forgot_success_message', 'Ако имейл адресът съществува в системата, изпратихме инструкции за възстановяване.'));
            setForgotEmail('');
        } catch (err) {
            const serverKey = err.response?.data?.error;
            setError(t(serverKey, serverKey || t('network_error', 'Възникна мрежова грешка. Моля, опитайте отново.')));
        } finally {
            setLoading(false);
        }
    };

    const tabStyle = (tab) => ({
        flex: 1,
        padding: '10px',
        border: 'none',
        background: 'none',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        borderBottom: activeTab === tab ? '3px solid #28a745' : 'none',
        color: activeTab === tab ? '#28a745' : 'var(--text, #666)',
        cursor: 'pointer'
    });

    return (
        <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    background: 'var(--bg, #fff)', color: 'var(--text-h, #222)',
                    border: '1px solid var(--border, #eee)',
                    padding: '30px', borderRadius: '8px', width: '420px', maxWidth: '92vw',
                    position: 'relative', maxHeight: '90vh', overflowY: 'auto'
                }}
            >
                <button
                    onClick={onClose}
                    aria-label={t('close', 'Затвори')}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'inherit' }}
                >
                    ✕
                </button>

                {activeTab !== 'forgot' ? (
                    <div style={{ display: 'flex', borderBottom: '2px solid var(--border, #eee)', marginBottom: '20px' }}>
                        <button type="button" onClick={() => switchTab('login')} style={tabStyle('login')}>
                            {t('login_tab', 'Вход')}
                        </button>
                        <button type="button" onClick={() => switchTab('register')} style={tabStyle('register')}>
                            {t('register_tab', 'Регистрация')}
                        </button>
                    </div>
                ) : (
                    <div style={{ marginBottom: '20px', borderBottom: '2px solid var(--border, #eee)', paddingBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('forgot_password_title', 'Възстановяване на парола')}</h3>
                    </div>
                )}

                {error && (
                    <div style={{ ...alertBase, backgroundColor: '#f8d7da', color: '#721c24' }}>
                        {typeof error === 'string' ? error : JSON.stringify(error)}
                    </div>
                )}
                {successMessage && (
                    <div style={{ ...alertBase, backgroundColor: '#d4edda', color: '#155724' }}>{successMessage}</div>
                )}

                {/* ВХОД */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLoginSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>{t('email_label', 'Имейл:')}</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <PasswordField
                            label={t('password_label', 'Парола:')}
                            value={loginPassword}
                            onChange={setLoginPassword}
                            autoComplete="current-password"
                            marginBottom="10px"
                        />

                        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={() => switchTab('forgot')}
                                style={{ background: 'none', border: 'none', color: '#007bff', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                            >
                                {t('forgot_password_link', 'Забравена парола?')}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {t('login_btn', 'Вход')}
                        </button>
                        <GoogleSignIn
                            onSuccess={onClose}
                            onError={(message) => setError(t(message, message || t('google_error')))}
                        />
                    </form>
                )}

                {/* РЕГИСТРАЦИЯ */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={labelStyle}>{t('email_label', 'Имейл:')}</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <PasswordField
                            label={t('password_label', 'Парола:')}
                            value={regPassword}
                            onChange={setRegPassword}
                            autoComplete="new-password"
                            minLength={8}
                            hint={t('password_hint', 'Минимум 8 символа.')}
                        />

                        <PasswordField
                            label={t('confirm_password_label', 'Повтори парола:')}
                            value={regConfirmPassword}
                            onChange={setRegConfirmPassword}
                            autoComplete="new-password"
                            minLength={8}
                        />

                        <div style={{ marginBottom: '12px' }}>
                            <label style={labelStyle}>{t('name_optional_label', 'Име (незадължително):')}</label>
                            <input
                                type="text"
                                value={regDisplayName}
                                onChange={(e) => setRegDisplayName(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* Чекбокс за абонамент */}
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="newsletter-sub"
                                checked={regIsSubscribed}
                                onChange={(e) => setRegIsSubscribed(e.target.checked)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <label htmlFor="newsletter-sub" style={{ fontSize: '0.85rem', color: 'var(--text, #555)', cursor: 'pointer', margin: 0 }}>
                                {t('subscribe_newsletter_label', 'Искам да получавам нови рецепти и вдъхновения по имейл')}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? t('registering', 'Регистрация...') : t('register_btn', 'Регистрирай се')}
                        </button>
                        <GoogleSignIn
                            onSuccess={onClose}
                            onError={(message) => setError(t(message, message || t('google_error')))}
                        />
                    </form>
                )}

                {/* ЗАБРАВЕНА ПАРОЛА */}
                {activeTab === 'forgot' && (
                    <form onSubmit={handleForgotSubmit}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text, #666)', marginBottom: '15px' }}>
                            {t('forgot_password_desc', 'Въведете вашия имейл адрес и ще ви изпратим линк за нулиране на паролата.')}
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>{t('email_label', 'Имейл:')}</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '10px' }}
                        >
                            {loading ? t('sending', 'Изпращане...') : t('send_reset_link_btn', 'Изпрати линк за ресет')}
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTab('login')}
                            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text, #666)', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            {t('back_to_login', '← Обратно към Вход')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
