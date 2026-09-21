import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const persistAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

const mapAuth = (data, fallbackEmail) => {
    const token = data.token || data.Token;
    const user = {
        id: data.userId || data.UserId,
        email: data.email || data.Email || fallbackEmail,
        displayName: data.displayName || data.DisplayName || fallbackEmail,
        role: data.role || data.Role || 'User'
    };
    return { token, user };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'undefined') {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    setUser(null);
                }
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const applyAuth = (data, email) => {
        const mapped = mapAuth(data, email);
        if (!mapped.token) return { success: false, message: 'Не получихме токен от сървъра.' };
        persistAuth(mapped.token, mapped.user);
        setToken(mapped.token);
        setUser(mapped.user);
        return { success: true };
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            return applyAuth(response.data, email);
        } catch (error) {
            const errData = error.response?.data;
            const msg = errData?.error || errData?.message || 'Грешка при вход';
            return { success: false, message: typeof msg === 'string' ? msg : 'Грешка при вход' };
        }
    };

    const register = async (email, password, displayName) => {
        try {
            const response = await api.post('/auth/register', { email, password, displayName });
            return applyAuth(response.data, email);
        } catch (error) {
            const errData = error.response?.data;
            const msg = errData?.error || 'Този имейл вече е зает или паролата е слаба.';
            return { success: false, message: typeof msg === 'string' ? msg : 'Грешка при регистрация' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'Admin',
        loading,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth трябва да се използва вътре в AuthProvider');
    }
    return context;
};
