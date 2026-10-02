import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ role }) {
    const { user, isAuthenticated, loading } = useAuth();
    const { t } = useTranslation();

    if (loading) {
        // Използваме ключа "loading", който съществува в твоя i18n файл
        return <div>{t('loading', { defaultValue: 'Зареждане на рецепти...' })}</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (role && user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}