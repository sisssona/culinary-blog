import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ConfirmEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { markEmailConfirmed } = useAuth();
    const { t } = useTranslation();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState(t('verifying_email') || 'Потвърждаване на вашия имейл адрес...');

    // Токенът е еднократен. React StrictMode (в dev) изпълнява useEffect два пъти —
    // без този guard втората заявка би получила "невалиден токен" и би презаписала успеха.
    const hasRequestedRef = useRef(false);

    useEffect(() => {
        if (hasRequestedRef.current) return;
        hasRequestedRef.current = true;

        if (!token) {
            setStatus('error');
            setMessage(t('missing_confirmation_token') || 'Липсва токен за потвърждение.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get('/auth/confirm-email', { params: { token } });
                markEmailConfirmed();
                setStatus('success');
                // Тук бекендът връща ключ (напр. "email_confirmed_successfully"), който превеждаме с t()
                const serverMsg = response.data?.message;
                setMessage(serverMsg ? t(serverMsg) : (t('email_confirmed_successfully') || 'Имейлът ви беше успешно потвърден!'));
            } catch (err) {
                setStatus('error');
                const serverErr = err.response?.data?.error;
                setMessage(serverErr ? t(serverErr) : (t('error_confirming_email') || 'Възникна грешка при потвърждението на имейла.'));
            }
        };

        verifyEmail();
    }, [token, t]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '20px', color: status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#333' }}>
                    {status === 'success' ? (t('success_title') || 'Успех!') : status === 'error' ? (t('error_title') || 'Грешка') : (t('please_wait') || 'Моля, изчакайте')}
                </h2>
                <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>{message}</p>

                <button
                    onClick={() => navigate('/')}
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                >
                    {t('back_to_home') || 'Към началната страница'}
                </button>
            </div>
        </div>
    );
}
