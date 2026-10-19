import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function LoginModal({ isOpen, onClose }) {
    const { login, register } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'

    // Login states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register states
    const [regDisplayName, setRegDisplayName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');

    // Forgot password state
    const [forgotEmail, setForgotEmail] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        const result = await login(loginEmail, loginPassword);
        if (result.success) {
            onClose();
            setLoginEmail('');
            setLoginPassword('');
        } else {
            setError(result.message);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (regPassword !== regConfirmPassword) {
            setError(t('passwords_mismatch') || 'Паролите не съвпадат.');
            return;
        }

        setLoading(true);
        const result = await register(regEmail, regPassword, regDisplayName);
        setLoading(false);

        if (result.success) {
            setSuccessMessage(t('reg_success_message') || 'Успешна регистрация! Моля, проверете имейла си за потвърждение.');
            setRegDisplayName('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');
        } else {
            setError(result.message);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: forgotEmail });
            setSuccessMessage(t('forgot_success_message') || 'Ако имейл адресът съществува в системата, изпратихме инструкции за възстановяване.');
            setForgotEmail('');
        } catch (err) {
            setError(t('network_error') || 'Възникна мрежова грешка. Моля, опитайте отново.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '420px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

                {activeTab !== 'forgot' ? (
                    <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
                        <button type="button" onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: activeTab === 'login' ? 'bold' : 'normal', borderBottom: activeTab === 'login' ? '3px solid #28a745' : 'none', color: activeTab === 'login' ? '#28a745' : '#666', cursor: 'pointer' }}>{t('login_tab') || 'Вход'}</button>
                        <button type="button" onClick={() => { setActiveTab('register'); setError(''); setSuccessMessage(''); }} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: activeTab === 'register' ? 'bold' : 'normal', borderBottom: activeTab === 'register' ? '3px solid #28a745' : 'none', color: activeTab === 'register' ? '#28a745' : '#666', cursor: 'pointer' }}>{t('register_tab') || 'Регистрация'}</button>
                    </div>
                ) : (
                    <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{t('forgot_password_title') || 'Възстановяване на парола'}</h3>
                    </div>
                )}

                {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' }}>{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
                {successMessage && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '15px' }}>{successMessage}</div>}

                {/* LOGIN TAB */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLoginSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('email_label') || 'Имейл:'}</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('password_label') || 'Парола:'}</label>
                            <input
                                type="password"
                                autoComplete="current-password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMessage(''); }}
                                style={{ background: 'none', border: 'none', color: '#007bff', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                            >
                                {t('forgot_password_link') || 'Забравена парола?'}
                            </button>
                        </div>

                        <button type="submit" style={{ width: '100%', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>{t('login_btn') || 'Вход'}</button>
                    </form>
                )}

                {/* REGISTER TAB */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('email_label') || 'Имейл:'}</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('password_label') || 'Парола:'}</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                            <small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '3px' }}>
                                {t('password_requirements') || 'Изисквания: мин. 6 символа, главна буква, малка буква, цифра и символ.'}
                            </small>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('confirm_password_label') || 'Повтори парола:'}</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('name_optional_label') || 'Име (незадължително):'}</label>
                            <input
                                type="text"
                                value={regDisplayName}
                                onChange={(e) => setRegDisplayName(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? (t('loading') || 'Регистрация...') : (t('register_btn') || 'Регистрирай се')}
                        </button>
                    </form>
                )}

                {/* FORGOT PASSWORD TAB */}
                {activeTab === 'forgot' && (
                    <form onSubmit={handleForgotSubmit}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                            {t('forgot_password_desc') || 'Въведете вашия имейл адрес и ще ви изпратим линк за нулиране на паролата.'}
                        </p>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('email_label') || 'Имейл:'}</label>
                            <input
                                type="email"
                                required
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                            {loading ? (t('loading') || 'Изпращане...') : (t('send_reset_link_btn') || 'Изпрати линк за ресет')}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#666', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            {t('back_to_login') || '← Обратно към Вход'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}