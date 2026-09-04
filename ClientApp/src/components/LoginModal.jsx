import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Импортираме контекста

export default function LoginModal({ isOpen, onClose }) {
    const { login } = useAuth(); // Вземаме login метода директно от AuthContext
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Извикваме логин през контекста, за да се обнови целия App state
        const result = await login(email, password);

        if (result.success) {
            onClose(); // Затваряме модала при успех
        } else {
            setError(result.message || 'Невалиден имейл или парола.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '350px' }}>
                <h2>Вход в системата</h2>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Имейл:</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Парола:</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 15px' }}>
                            Отказ
                        </button>
                        <button type="submit" style={{ backgroundColor: '#008CBA', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>
                            Вход
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}