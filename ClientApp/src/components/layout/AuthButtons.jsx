import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AuthButtons() {
    const { token, logout } = useAuth();
    const { t } = useTranslation();
    const isLogged = !!token;

    return (
        <div className="auth-buttons">
            {isLogged ? (
                <>
                    <Link to="/add-recipe" className="btn green">
                        {t('btn_add_recipe')}
                    </Link>

                    <Link to="/profile" className="btn blue">
                        {t('btn_my_recipes')}
                    </Link>

                    <button onClick={logout} className="btn red">
                        {t('btn_logout')}
                    </button>
                </>
            ) : (
                <button className="btn blue" id="open-login">
                    {t('btn_login')}
                </button>
            )}
        </div>
    );
}
