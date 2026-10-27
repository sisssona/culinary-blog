import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyRecipes } from '../api/recipeService';
import api from '../api/axios';

export default function MyRecipes() {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getMyRecipes()
            .then((data) => setRecipes(Array.isArray(data) ? data : []))
            .catch(() => setError(t('error_loading_my_recipes')))
            .finally(() => setLoading(false));
    }, [t]);

    const handleDelete = async (recipeId) => {
        if (!window.confirm(t('confirm_delete'))) return;
        try {
            await api.delete(`/recipes/${recipeId}`);
            setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
        } catch {
            alert(t('error_deleting'));
        }
    };

    if (loading) return <p className="loading">{t('loading')}</p>;
    if (error) return <p className="admin-articles-error">{error}</p>;

    return (
        <section className="home-section">
            <h1>{t('my_uploaded_recipes')}</h1>
            {recipes.length === 0 ? (
                <p>{t('no_uploaded_recipes')}</p>
            ) : (
                <div className="recipe-grid">
                    {recipes.map((recipe) => {
                        const image = recipe.imageUrl || recipe.thumbnailUrl;
                        return (
                            <article key={recipe.id} className="recipe-card">
                                <Link to={`/recipes/${recipe.id}`} className="recipe-image-wrapper">
                                    {image ? (
                                        <img src={image} alt="" className="recipe-image" />
                                    ) : (
                                        <div className="recipe-image recipe-image-empty" aria-hidden="true">🍽</div>
                                    )}
                                </Link>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.title}</h3>
                                    <p className="recipe-category">{recipe.category}</p>
                                    <div className="my-recipe-actions">
                                        <Link to={`/recipes/${recipe.id}/edit`} className="btn blue">{t('btn_edit')}</Link>
                                        <button type="button" className="btn red" onClick={() => handleDelete(recipe.id)}>
                                            {t('btn_delete')}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
