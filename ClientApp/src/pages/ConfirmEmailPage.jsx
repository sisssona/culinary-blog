import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ConfirmEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { markEmailConfirmed } = useAuth();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('Потвърждаване на вашия имейл адрес...');

    // Токенът е еднократен. React StrictMode (в dev) изпълнява useEffect два пъти —
    // без този guard втората заявка би получила "невалиден токен" и би презаписала успеха.
    const hasRequestedRef = useRef(false);

    useEffect(() => {
        if (hasRequestedRef.current) return;
        hasRequestedRef.current = true;

        if (!token) {
            setStatus('error');
            setMessage('Липсва токен за потвърждение.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await api.get('/auth/confirm-email', { params: { token } });
                markEmailConfirmed();
                setStatus('success');
                setMessage(response.data?.message || 'Имейлът ви беше успешно потвърден! Вече можете да влезете в профила си.');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Възникна грешка при потвърждението на имейла.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ marginBottom: '20px', color: status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#333' }}>
                    {status === 'success' ? 'Успех!' : status === 'error' ? 'Грешка' : 'Моля, изчакайте'}
                </h2>
                <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>{message}</p>

                <button
                    onClick={() => navigate('/')}
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                >
                    Към началната страница
                </button>
            </div>
        </div>
    );
}