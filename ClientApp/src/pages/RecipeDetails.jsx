import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function RecipeDetails({ lang }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { token } = useAuth();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`/recipes/${id}?lang=${lang}`)
            .then((res) => setRecipe(res.data))
            .catch(() => setError("Не успяхме да заредим рецептата."))
            .finally(() => setLoading(false));
    }, [id, lang]);

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete'))) return;

        try {
            await api.delete(`/recipes/${id}`);
            navigate('/');
        } catch {
            alert("Грешка при изтриване на рецептата.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading) return <p className="loading">Зареждане...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!recipe) return <p className="error">Рецептата не е намерена.</p>;

    return (
        <div className="recipe-details">

            <div className="recipe-details-header">
                <Link to="/" className="back-link">
                    ← Обратно към всички рецепти
                </Link>

                {token && (
                    <div className="recipe-actions">
                        <button onClick={() => navigate(`/recipes/${id}/edit`)} className="btn edit">
                            ✏️ Редактирай
                        </button>
                        <button onClick={handleDelete} className="btn delete">
                            🗑️ Изтрий
                        </button>
                    </div>
                )}
            </div>

            <h1 className="recipe-title">{recipe.title}</h1>
            <p className="recipe-category">
                Категория: <strong>{recipe.category}</strong>
            </p>

            {recipe.imageUrl && (
                <img
                    src={getImageUrl(recipe.imageUrl)}
                    alt={recipe.title}
                    className="recipe-image"
                />
            )}

            <section className="recipe-section">
                <h3>Съставки</h3>
                <p className="recipe-text">{recipe.ingredients}</p>
            </section>

            <section className="recipe-section">
                <h3>Инструкции</h3>
                <p className="recipe-text">{recipe.instructions}</p>
            </section>
        </div>
    );
}
