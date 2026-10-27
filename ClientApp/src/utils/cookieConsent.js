const NAME = 'cookie_consent';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function readCookieConsent() {
    const row = document.cookie
        .split('; ')
        .find((part) => part.startsWith(`${NAME}=`));
    if (!row) return null;
    const value = decodeURIComponent(row.slice(NAME.length + 1));
    return value === 'all' || value === 'necessary' ? value : null;
}

export function writeCookieConsent(value) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${NAME}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function optionalCookiesAllowed() {
    return readCookieConsent() === 'all';
}
