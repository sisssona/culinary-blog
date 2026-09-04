import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Автоматично закача токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Обработка на грешки и глобални статуси
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        const status = error.response?.status;

        if (status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        } else if (status === 403) {
            console.warn('Достъпът е отказан: Нямате нужните права за това действие.');
        } else if (status === 429) {
            console.warn('Твърде много заявки. Моля, опитайте по-късно.');
        }

        return Promise.reject(error);
    }
);

export default api;