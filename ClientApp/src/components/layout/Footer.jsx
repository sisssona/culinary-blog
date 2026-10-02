import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="footer">
            <p>© 2026 {t('footer_text')} — Savina</p>
        </footer>
    );
}