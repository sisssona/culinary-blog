import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function RecipeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';
    const { token } = useAuth();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`/recipes/${id}`, { params: { lang } })
            .then((res) => setRecipe(res.data))
            .catch(() => setError(t('error_loading_recipe') || "Не успяхме да заредим рецептата."))
            .finally(() => setLoading(false));
    }, [id, lang, t]);

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete') || "Сигурни ли сте, че искате да изтриете тази рецепта?")) return;

        try {
            await api.delete(`/recipes/${id}`);
            navigate('/');
        } catch {
            alert(t('error_deleting_recipe') || "Грешка при изтриване на рецептата.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading) return <p className="loading">{t('loading') || 'Зареждане...'}</p>;
    if (error) return <p className="error">{error}</p>;
    if (!recipe) return <p className="error">{t('recipe_not_found') || 'Рецептата не е намерена.'}</p>;

    return (
        <div className="recipe-details">

            <div className="recipe-details-header">
                <Link to="/" className="back-link">
                    {t('btn_back_to_recipes') || '← Обратно към всички рецепти'}
                </Link>

                {token && (
                    <div className="recipe-actions">
                        <button onClick={() => navigate(`/recipes/${id}/edit`)} className="btn edit">
                            ✏️ {t('btn_edit') || 'Редактирай'}
                        </button>
                        <button onClick={handleDelete} className="btn delete">
                             {t('btn_delete') || 'Изтрий'}
                        </button>
                    </div>
                )}
            </div>

            <h1 className="recipe-title">{recipe.title}</h1>
            <p className="recipe-category">
                {t('category_label') || 'Категория'}: <strong>{recipe.category}</strong>
            </p>

            {recipe.tags && recipe.tags.length > 0 && (
                <div className="recipe-tags recipe-tags-details">
                    {recipe.tags.map((tag) => (
                        <Link key={tag.id} to={`/recipes?tag=${tag.slug}`} className="tag-chip">
                            #{tag.name}
                        </Link>
                    ))}
                </div>
            )}

            {recipe.imageUrl && (
                <img
                    src={getImageUrl(recipe.imageUrl)}
                    alt={recipe.title}
                    className="recipe-image"
                />
            )}

            <section className="recipe-section">
                <h3>{t('ingredients_title')}</h3>
                <p className="recipe-text">{recipe.ingredients}</p>
            </section>

            <section className="recipe-section">
                <h3>{t('instructions_title')}</h3>
                <p className="recipe-text">{recipe.instructions}</p>
            </section>
        </div>
    );
}