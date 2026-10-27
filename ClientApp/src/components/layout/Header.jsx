import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import AuthButtons from './AuthButtons';
import LogoMark from './LogoMark';

export default function Header({ onLoginOpen }) {
    const { t } = useTranslation();

    return (
        <header className="header">
            {/* Ляво: Лого на сайта */}
            <div className="header-left">
                <Link to="/" className="logo">
                    <LogoMark />
                    <span className="logo-text">
                        <span className="logo-name">{t('blog_title', 'Tava')}</span>
                        <span className="logo-tagline">{t('blog_tagline', 'Вкусове без граници')}</span>
                    </span>
                </Link>
            </div>

            {/* Централно навигационно меню с ключове за превод */}
            <nav className="header-nav-links">
                <Link to="/">{t('home')}</Link>
                <Link to="/recipes">{t('recipes')}</Link>
                <Link to="/shop">{t('shop')}</Link>
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