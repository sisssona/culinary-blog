import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AuthButtons({ onLoginOpen }) {
    const { token, user, logout } = useAuth();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onPointer = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!token) {
        return (
            <div className="auth-buttons">
                <button type="button" onClick={onLoginOpen} className="btn blue">
                    {t('btn_login', 'Вход')}
                </button>
            </div>
        );
    }

    return (
        <div className="auth-buttons">
            <Link to="/add-recipe" className="btn green">
                {t('btn_add_recipe', '+ Добави рецепта')}
            </Link>
            <div className="user-menu-wrap" ref={menuRef}>
                <button
                    type="button"
                    className="user-menu-button"
                    aria-expanded={open}
                    aria-haspopup="menu"
                    onClick={() => setOpen((value) => !value)}
                >
                    <span className="user-menu-name">{user?.displayName || t('account_menu')}</span>
                    <span className="user-menu-caret" aria-hidden="true">▾</span>
                </button>
                {open && (
                    <div className="user-menu" role="menu">
                        <Link to="/my-recipes" className="user-menu-recipes" role="menuitem" onClick={() => setOpen(false)}>
                            {t('menu_my_recipes')}
                        </Link>
                        <Link to="/account" className="user-menu-account" role="menuitem" onClick={() => setOpen(false)}>
                            {t('menu_account')}
                        </Link>
                        <button type="button" className="user-menu-logout" role="menuitem" onClick={() => { setOpen(false); logout(); }}>
                            {t('btn_logout', 'Изход')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
