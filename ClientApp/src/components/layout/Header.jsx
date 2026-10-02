import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import AuthButtons from './AuthButtons';

export default function Header({ onLoginOpen }) {
    const { t } = useTranslation();

    return (
        <header className="header">
            {/* Ляво: Лого на сайта */}
            <div className="header-left">
                <Link to="/" className="logo">
                    🍳 {t('blog_title') || 'Вкусни Рецепти'}
                </Link>
            </div>

            {/* Централно навигационно меню с ключове за превод */}
            <nav className="header-nav-links">
                <Link to="/">{t('home')}</Link>
                <Link to="/recipes">{t('recipes')}</Link>
                <Link to="/encyclopedia">{t('encyclopedia')}</Link>
                <Link to="/about">{t('about')}</Link>
            </nav>

            {/* Дясно: Езици и бутони за вход/изход */}
            <div className="header-right">
                <LanguageSwitcher />
                <AuthButtons onLoginOpen={onLoginOpen} />
            </div>
        </header>
    );
}