import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AuthButtons({ onLoginOpen }) {
    const { token, user, logout } = useAuth();
    const { t } = useTranslation();
    const isLogged = !!token;

    return (
        <div className="auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLogged ? (
                <>
                    {user?.displayName && (
                        <span className="user-welcome" style={{ fontWeight: '600', color: 'var(--text-h, #222)', marginRight: '5px' }}>
                            👋 {user.displayName}
                        </span>
                    )}

                    <Link to="/add-recipe" className="btn green">
                        {t('btn_add_recipe', '+ Добави рецепта')}
                    </Link>

                    <Link to="/profile" className="btn blue">
                        {t('btn_my_recipes', '📖 Моите рецепти')}
                    </Link>

                    <button onClick={logout} className="btn red">
                        {t('btn_logout', 'Изход')}
                    </button>
                </>
            ) : (
                <button onClick={onLoginOpen} className="btn blue">
                    {t('btn_login', 'Вход')}
                </button>
            )}
        </div>
    );
}
