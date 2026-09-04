import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Зареждане...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};