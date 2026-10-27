import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignIn({ onSuccess, onError }) {
    const { t, i18n } = useTranslation();
    const { loginWithGoogle } = useAuth();
    const host = useRef(null);
    const [clientId, setClientId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get('/auth/google-client')
            .then((res) => {
                if (!cancelled) setClientId(res.data?.clientId || '');
            })
            .catch(() => {
                if (!cancelled) setClientId('');
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!clientId || !host.current) return undefined;

        const lang = i18n.language?.startsWith('en') ? 'en' : 'bg';
        let removeLoad = () => {};

        const render = () => {
            if (!window.google?.accounts?.id || !host.current) return;
            host.current.innerHTML = '';
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    const result = await loginWithGoogle(response.credential);
                    if (result.success) onSuccess();
                    else onError(result.message);
                }
            });
            const width = Math.max(240, Math.min(360, host.current.parentElement?.clientWidth || 320));
            window.google.accounts.id.renderButton(host.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width,
                locale: lang
            });
        };

        if (window.google?.accounts?.id) {
            render();
            return undefined;
        }

        let script = document.querySelector('script[data-google-gsi]');
        if (!script) {
            script = document.createElement('script');
            script.src = `https://accounts.google.com/gsi/client?hl=${lang}`;
            script.async = true;
            script.dataset.googleGsi = '1';
            document.head.appendChild(script);
        }
        script.addEventListener('load', render);
        removeLoad = () => script.removeEventListener('load', render);
        return removeLoad;
    }, [clientId, i18n.language, loginWithGoogle, onError, onSuccess]);

    if (!clientId) return null;

    return (
        <div className="google-signin">
            <p className="google-signin-or">{t('google_or')}</p>
            <div ref={host} />
            <p className="google-signin-note">{t('google_note')}</p>
        </div>
    );
}
