import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { readCookieConsent, writeCookieConsent } from '../utils/cookieConsent';

export default function CookieNotice() {
    const { t } = useTranslation();
    const [consent, setConsent] = useState(() => readCookieConsent());
    const [open, setOpen] = useState(() => readCookieConsent() == null);

    useEffect(() => {
        const show = () => setOpen(true);
        window.addEventListener('open-cookie-settings', show);
        return () => window.removeEventListener('open-cookie-settings', show);
    }, []);

    const choose = (value) => {
        writeCookieConsent(value);
        setConsent(value);
        setOpen(false);
    };

    if (!open) return null;

    return (
        <div className="cookie-notice" role="dialog" aria-modal="false" aria-label={t('cookies.title')}>
            <p>
                {t('cookies.lead')}{' '}
                <Link to="/privacy" onClick={() => setOpen(false)}>{t('cookies.privacy')}</Link>
                {consent ? ` ${t(`cookies.current_${consent}`)}` : ''}
            </p>
            <div className="cookie-actions">
                <button type="button" className="cookie-reject" onClick={() => choose('necessary')}>
                    {t('cookies.reject')}
                </button>
                <button type="button" className="cookie-accept" onClick={() => choose('all')}>
                    {t('cookies.accept')}
                </button>
            </div>
        </div>
    );
}
