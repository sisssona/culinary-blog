import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <div className="lang-switcher">
            <button
                onClick={() => i18n.changeLanguage('bg')}
                className={currentLang.startsWith('bg') ? 'active' : ''}
            >
                🇧🇬 BG
            </button>

            <button
                onClick={() => i18n.changeLanguage('en')}
                className={currentLang.startsWith('en') ? 'active' : ''}
            >
                🇬🇧 EN
            </button>
        </div>
    );
}
