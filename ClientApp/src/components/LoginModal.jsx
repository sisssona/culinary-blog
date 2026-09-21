import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginModal({ isOpen, onClose }) {
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState('login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
        try {
            await api.post('/auth/register', {
                email: regEmail,
                password: regPassword
            });
            setSuccessMessage('Успешна регистрация! Сега влезте.');
            setActiveTab('login');
            setLoginEmail(regEmail); // попълваме имейла за удобство
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            const errData = err.response?.data;
            setError(errData?.error || 'Този имейл вече е зает или паролата е слаба.');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '400px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
                    <button type="button" onClick={() => setActiveTab('login')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: activeTab === 'login' ? 'bold' : 'normal', borderBottom: activeTab === 'login' ? '3px solid #28a745' : 'none', color: activeTab === 'login' ? '#28a745' : '#666', cursor: 'pointer' }}>Вход</button>
                    <button type="button" onClick={() => setActiveTab('register')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: activeTab === 'register' ? 'bold' : 'normal', borderBottom: activeTab === 'register' ? '3px solid #28a745' : 'none', color: activeTab === 'register' ? '#28a745' : '#666', cursor: 'pointer' }}>Регистрация</button>
                </div>
                {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
                {successMessage && <p style={{ color: 'green', fontSize: '0.9rem', marginBottom: '10px' }}>{successMessage}</p>}
                {activeTab === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
                        <div style={{ marginBottom: '15px' }}><label>Имейл:</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                        <div style={{ marginBottom: '20px' }}><label>Парола:</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                        <button type="submit" style={{ width: '100%', backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Вход</button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit}>
                        <div style={{ marginBottom: '12px' }}><label>Имейл:</label><input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                        <div style={{ marginBottom: '20px' }}><label>Парола:</label><input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                        <button type="submit" style={{ width: '100%', backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Регистрирай се</button>
                    </form>
                )}
            </div>
        </div>
    );
}