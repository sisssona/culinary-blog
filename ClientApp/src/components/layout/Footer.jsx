import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Footer() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setMessage('');

        // Вземаме текущия език ('en' или 'bg')
        const preferredLanguage = i18n.language?.startsWith('en') ? 'en' : 'bg';

        try {
            const res = await api.post('/newsletter/subscribe', {
                email,
                preferredLanguage
            });
            const code = res.data?.code;

            if (code === 'RESUBSCRIBED_SUCCESS') {
                setMessage(t('newsletter.resubscribed_success', 'Успяхте да се абонирате отново успешно!'));
            } else {
                setMessage(t('newsletter.subscribed_success', 'Благодарим ви за абонамента!'));
            }

            setStatus('success');
            setEmail('');
        } catch (err) {
            const errorData = err.response?.data;
            const code = errorData?.code;
            const serverMessage = errorData?.message || '';

            if (code === 'ALREADY_SUBSCRIBED' || serverMessage.includes('вече е абониран')) {
                setMessage(t('newsletter.already_subscribed', 'Този имейл адрес вече е абониран за бюлетина.'));
            } else if (code === 'INVALID_EMAIL' || serverMessage.includes('валиден имейл')) {
                setMessage(t('newsletter.invalid_email', 'Моля, въведете валиден имейл адрес.'));
            } else {
                setMessage(t('newsletter.error_generic', 'Възникна грешка при абонирането. Опитайте отново.'));
            }

            setStatus('error');
        }
    };

    return (
        <footer style={{ backgroundColor: '#f7f4ed', color: '#2c2c2c', padding: '40px 20px', marginTop: '50px', borderTop: '1px solid #e3decb' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                {/* Горна част с форма и описание */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>

                    <div style={{ flex: '1 1 400px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
                            🍲 {t('newsletter_title', 'Абонирайте се за нашия кулинарен бюлетин')}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#665c54', margin: 0, lineHeight: '1.5' }}>
                            {t('newsletter_subtitle', 'Получавайте най-вкусните нови рецепти и вдъхновения директно във вашата поща.')}
                        </p>
                    </div>

                    <div style={{ flex: '1 1 350px' }}>
                        <form className="footer-subscribe" onSubmit={handleSubscribe}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('newsletter_placeholder', 'Вашият имейл адрес...')}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #d5ccd0',
                                    backgroundColor: '#ffffff',
                                    color: '#2c2c2c',
                                    outline: 'none'
                                }}
                                disabled={status === 'loading'}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: '#b45309',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading'
                                    ? t('newsletter_submitting', 'Запис...')
                                    : t('newsletter_button', 'Абонирай се')
                                }
                            </button>
                        </form>

                        {message && (
                            <p style={{
                                fontSize: '13px',
                                marginTop: '8px',
                                color: status === 'success' ? '#15803d' : '#b91c1c',
                                fontWeight: '500'
                            }}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Долна част с авторски права и линкове */}
                <div className="footer-bottom">
                    <p style={{ margin: 0 }}>© 2026 {t('footer_text', 'Tava')} — Savina. {t('all_rights_reserved', 'Всички права запазени.')}</p>
                    <p style={{ margin: '6px 0 0' }}>{t('footer_company')}</p>
                    <div className="footer-links">
                        <Link to="/privacy">{t('privacy_policy', 'Политика за поверителност')}</Link>
                        <Link to="/terms">{t('terms_of_service', 'Общи условия')}</Link>
                        <button type="button" className="footer-cookie" onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>
                            {t('cookies.footer')}
                        </button>
                        <span style={{ cursor: 'pointer', color: '#b45309' }} onClick={() => navigate('/unsubscribe')}>
                            {t('newsletter.unsubscribe_title', 'Отписване от бюлетин')}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
