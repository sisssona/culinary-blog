import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Закачаме/премахваме токена в Axios за всички HTTP заявки
    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const storedUser = localStorage.getItem('user');

            if (storedUser && storedUser !== 'undefined') {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    setUser({ email: 'Моят Профил' });
                }
            } else {
                const defaultUser = { email: 'Моят Профил' };
                setUser(defaultUser);
                localStorage.setItem('user', JSON.stringify(defaultUser));
            }
        } else {
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        }

        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            const jwtToken = response.data.token || response.data.Token || response.data;
            const userData = response.data.user || response.data.User || { email };

            if (jwtToken && typeof jwtToken === 'string') {
                localStorage.setItem('token', jwtToken);
                localStorage.setItem('user', JSON.stringify(userData));

                api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
                setToken(jwtToken);
                setUser(userData);
                return { success: true };
            } else {
                return { success: false, message: 'Невалиден формат на токена.' };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Грешка при вход'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth трябва да се използва вътре в AuthProvider');
    }
    return context;
};