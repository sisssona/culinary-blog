import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import AuthButtons from './AuthButtons';

export default function Header() {
    const { t } = useTranslation();

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="logo">
                    🍳 {t('blog_title')}
                </Link>
            </div>

            <nav className="header-right">
                <LanguageSwitcher />
                <AuthButtons />
            </nav>
        </header>
    );
}
