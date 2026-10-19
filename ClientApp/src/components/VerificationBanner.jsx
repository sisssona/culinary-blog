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
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 text-amber-800 flex flex-col sm:flex-row justify-between items-center shadow-sm">
            <div className="mb-2 sm:mb-0">
                <span className="font-semibold">{t('verify_email_title') || 'Внимание:'}</span>{' '}
                {t('verify_email_body') || 'Вашият имейл адрес все още не е потвърден. Моля, проверете пощенската си кутия.'}
                {message && <span className="block text-xs mt-1 text-amber-700">{message}</span>}
            </div>
            <button
                onClick={handleResend}
                disabled={resending}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
                {resending ? (t('verify_email_sending') || 'Изпращане...') : (t('verify_email_resend') || 'Прати нов имейл')}
            </button>
        </div>
    );
};

export default VerificationBanner;