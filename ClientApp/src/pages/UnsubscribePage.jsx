import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function UnsubscribePage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const emailFromUrl = searchParams.get('email') || '';
    const [email, setEmail] = useState(emailFromUrl);
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleUnsubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setMessage('');

        try {
            const res = await api.post('/newsletter/unsubscribe', { email });
            const code = res.data?.code;

            if (code === 'UNSUBSCRIBED_SUCCESS') {
                setMessage(t('newsletter.unsubscribe_success', 'Успяхте да се отпишете успешно от бюлетина.'));
            } else {
                setMessage(res.data?.message || t('newsletter.unsubscribe_success', 'Успяхте да се отпишете успешно от бюлетина.'));
            }
            setStatus('success');
        } catch (err) {
            const errorData = err.response?.data;
            const code = errorData?.code;
            const serverMessage = errorData?.message || '';

            if (code === 'NOT_SUBSCRIBED' || serverMessage.includes('не е активен абонат')) {
                setMessage(t('newsletter.unsubscribe_error_not_found', 'Този имейл адрес не е активен абонат.'));
            } else {
                setMessage(t('newsletter.unsubscribe_error_generic', 'Възникна грешка при отписването. Опитайте отново.'));
            }
            setStatus('error');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '80px auto', padding: '30px', backgroundColor: '#f7f4ed', borderRadius: '8px', border: '1px solid #e3decb', textAlign: 'center' }}>
            <h2 style={{ color: '#1a1a1a', marginBottom: '15px' }}>
                🍲 {t('newsletter.unsubscribe_title', 'Отписване от бюлетина')}
            </h2>

            {status === 'success' ? (
                <div>
                    <p style={{ color: '#15803d', fontWeight: '500', marginBottom: '20px' }}>{message}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#b45309', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {t('newsletter.btn_back_to_home', 'Към началната страница')}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleUnsubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <p style={{ color: '#665c54', fontSize: '14px', lineHeight: '1.5' }}>
                        {t('newsletter.unsubscribe_confirm_question', 'Сигурни ли сте, че искате да се отпишете с имейл адрес:')} <strong>{email}</strong>?
                    </p>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('newsletter.newsletter_placeholder', 'Вашият имейл адрес...')}
                        style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d5ccd0', backgroundColor: '#fff', outline: 'none' }}
                        disabled={status === 'loading'}
                    />

                    <button
                        type="submit"
                        style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#b91c1c', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading'
                            ? t('newsletter.newsletter_submitting', 'Запис...')
                            : t('newsletter.unsubscribe_button', 'Потвърди отписването')
                        }
                    </button>

                    {message && (
                        <p style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '500', marginTop: '10px' }}>
                            {message}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}
