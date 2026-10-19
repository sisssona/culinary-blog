import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyRecipes } from '../api/recipeService';
import api from '../api/axios';

export default function MyRecipes() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [accountError, setAccountError] = useState('');

    useEffect(() => {
        getMyRecipes()
            .then((data) => {
                if (Array.isArray(data)) {
                    setRecipes(data);
                } else {
                    setRecipes([]);
                }
            })
            .catch((err) => {
                console.error('Грешка при зареждане:', err);
                setError(t('error_loading_my_recipes') || 'Не успяхме да заредим вашите рецепти.');
            })
            .finally(() => setLoading(false));
    }, [t]);

    const handleDelete = async (recipeId) => {
        if (!window.confirm(t('confirm_delete') || "Сигурни ли сте, че искате да изтриете тази рецепта?")) return;
        try {
            await api.delete(`/recipes/${recipeId}`);
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
        } catch (err) {
            alert(t('error_deleting') || "Грешка при изтриване.");
        }
    };

    // Функция за изтриване на целия акаунт
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            t('confirm_delete_account') || "Сигурни ли сте, че искате да изтриете профила си? Това действие е необратимо и ще изтрие всички ваши данни!"
        );

        if (!confirmed) return;

        setDeletingAccount(true);
        setAccountError('');

        try {
            // Използваме конфигурирания 'api' инстанс, който автоматично добавя Bearer токена
            const response = await api.delete('/auth/delete-account');

            if (response.status === 200 || response.status === 204) {
                // Изчистване на токена от localStorage
                localStorage.removeItem('token'); // Или ключът, който използваш за токена
                // Пренасочване към началото и рефреш на страницата/състоянието
                navigate('/');
                window.location.reload();
            } else {
                setAccountError(response.data?.message || 'Възникна грешка при изтриването на акаунта.');
            }
        } catch (err) {
            console.error('Грешка при изтриване на акаунт:', err);
            setAccountError(err.response?.data?.message || 'Мрежова грешка или липса на права. Моля, опитайте отново.');
        } finally {
            setDeletingAccount(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>{t('loading') || 'Зареждане...'}</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>{t('my_uploaded_recipes') || 'Моите качени рецепти'}</h2>

            {!recipes || recipes.length === 0 ? (
                <p>{t('no_uploaded_recipes') || 'Все още нямате качени рецепти.'}</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {recipes?.map((recipe) => (
                        <div key={recipe.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                            <img
                                src={getImageUrl(recipe.thumbnailUrl || recipe.imageUrl)}
                                alt={recipe.title}
                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => { e.target.src = '/no-image.jpg' }}
                            />
                            <h3>{recipe.title}</h3>
                            <p>{t('category_label') || 'Категория'}: <strong>{recipe.category}</strong></p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <Link to={`/recipes/${recipe.id}/edit`} style={{ flex: 1 }}>
                                    <button style={{ width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                        ✏ {t('btn_edit') || 'Редактирай'}
                                    </button>
                                </Link>
                                <button onClick={() => handleDelete(recipe.id)} style={{ flex: 1, backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                    🗑 {t('btn_delete') || 'Изтрий'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Секция за опасно действие / Изтриване на акаунт */}
            <div style={{ marginTop: '60px', borderTop: '2px solid #ffcccc', paddingTop: '25px', backgroundColor: '#fff9f9', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: '#dc3545', fontSize: '1.2rem', marginTop: 0 }}>
                    {t('danger_zone_title') || 'Зона за опасни действия'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>
                    {t('danger_zone_description') || 'След като изтриете профила си, няма връщане назад. Всички ваши данни и качени рецепти ще бъдат премахнати.'}
                </p>

                {accountError && <p style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold' }}>{accountError}</p>}

                <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: deletingAccount ? 'not-allowed' : 'pointer',
                        opacity: deletingAccount ? 0.7 : 1
                    }}
                >
                    {deletingAccount ? (t('deleting') || 'Изтриване...') : (t('delete_account_btn') || 'Изтрий моя акаунт')}
                </button>
            </div>
        </div>
    );
}