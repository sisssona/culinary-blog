import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const cardStyle = {
    background: 'var(--bg, #fff)',
    color: 'var(--text-h, #222)',
    border: '1px solid var(--border, #ddd)',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '40px auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const buttonStyle = {
    backgroundColor: '#b45309',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    width: '100%'
};

export default function AdminNewsletterPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSendDigest = async () => {
        if (!window.confirm('Сигурни ли сте, че искате да изпратите бюлетин с новите рецепти до всички активни абонати?')) {
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await api.post('/newsletter/admin/send-digest');
            setMessage(response.data.message || 'Бюлетинът беше изпратен успешно!');
        } catch (err) {
            setError(err.response?.data?.message || 'Възникна грешка при изпращането на бюлетина.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text-h, #222)' }}>
                    {t('admin_newsletter_title', 'Управление и разпращане на бюлетин')}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text, #666)', lineHeight: '1.5', marginBottom: '25px' }}>
                    {t('admin_newsletter_desc', 'Оттук можете ръчно да задействате изпращането на най-новите неизпратени рецепти до всички активни абонати в системата.')}
                </p>

                {message && (
                    <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ padding: '12px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSendDigest}
                    disabled={loading}
                    style={{
                        ...buttonStyle,
                        backgroundColor: loading ? '#ccc' : '#b45309',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? t('sending_newsletter', 'Изпращане...') : t('send_newsletter_btn', '📥 Изпрати бюлетин с нови рецепти сега')}
                </button>
            </div>
        </div>
    );
}
