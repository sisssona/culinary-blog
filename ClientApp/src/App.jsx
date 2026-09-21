import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import AddRecipePage from './pages/AddRecipePage';
import RecipeDetails from './pages/RecipeDetails';
import EditRecipe from './pages/EditRecipe';
import MyRecipes from './pages/MyRecipes';
import LoginModal from './components/LoginModal';

function MainLayout() {
    const { t, i18n } = useTranslation();
    const { token, logout } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const currentLang = i18n.language || 'bg';
    const isLogged = !!token;

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '20px',
                borderBottom: '2px solid #eee',
                marginBottom: '30px'
            }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1 style={{ margin: 0 }}>🍳 {t('blog_title')}</h1>
                </Link>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginLeft: 'auto' }}>
                    <div>
                        <button onClick={() => i18n.changeLanguage('bg')} style={{ fontWeight: currentLang.startsWith('bg') ? 'bold' : 'normal', marginRight: '5px' }}>🇧🇬 BG</button>
                        <button onClick={() => i18n.changeLanguage('en')} style={{ fontWeight: currentLang.startsWith('en') ? 'bold' : 'normal' }}>🇬🇧 EN</button>
                    </div>

                    {isLogged ? (
                        <>
                            <Link to="/add-recipe">
                                <button style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                                    {t('btn_add_recipe')}
                                </button>
                            </Link>

                            <Link to="/profile">
                                <button style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                                    {t('btn_my_recipes')}
                                </button>
                            </Link>

                            <button onClick={logout} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                                {t('btn_logout')}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsLoginOpen(true)} style={{ backgroundColor: '#008CBA', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                            {t('btn_login')}
                        </button>
                    )}
                </div>
            </header>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/recipes" element={<HomePage />} />
                <Route path="/recipes/:id" element={<RecipeDetails />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/add-recipe" element={<AddRecipePage />} />
                    <Route path="/recipes/:id/edit" element={<EditRecipe />} />
                    <Route path="/profile" element={<MyRecipes />} />
                </Route>
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>
    );
}