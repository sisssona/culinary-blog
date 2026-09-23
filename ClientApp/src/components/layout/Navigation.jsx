import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";

export default function Navigation() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();

    return (
        <nav className="nav-categories">
            <Link to="/recipes?category=main">{t('category_main')}</Link>
            <Link to="/recipes?category=salads">{t('category_salads')}</Link>
            <Link to="/recipes?category=desserts">{t('category_desserts')}</Link>
            <Link to="/recipes?category=soups">{t('category_soups')}</Link>
            <Link to="/recipes?category=quick">{t('category_quick')}</Link>

            {isAdmin && (
                <Link to="/admin/categories" className="admin-link">Админ</Link>
            )}
        </nav>
    );
}
