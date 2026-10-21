import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const VerificationBanner = ({ userEmail }) => {
    const { t } = useTranslation();
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');
        try {
            await api.post('/auth/resend-confirmation', { email: userEmail });
            setMessage(t('verify_email_resent') || 'Имейлът за потвърждение е изпратен отново успешно!');
        } catch {
            setMessage(t('verify_email_resend_error') || 'Възникна грешка при изпращането.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div style={{
            backgroundColor: '#fef3c7',
            borderLeft: '4px solid #d97706',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            gap: '15px',
            flexWrap: 'wrap'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                    <h4 style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#78350f', fontSize: '15px' }}>
                        {t('verify_email_title') || 'Потвърждение на акаунта:'}
                    </h4>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                        {t('verify_email_body') || 'Вашият имейл адрес все още не е потвърден. Моля, проверете входящата си поща.'}
                    </p>
                    {message && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: '600', color: '#b45309' }}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleResend}
                disabled={resending}
                style={{
                    backgroundColor: '#d97706',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    opacity: resending ? 0.5 : 1,
                    whiteSpace: 'nowrap'
                }}
            >
                {resending
                    ? (t('verify_email_sending') || 'Изпращане...')
                    : (t('verify_email_resend') || 'Изпрати отново имейл')}
            </button>
        </div>
    );
};

export default VerificationBanner;
