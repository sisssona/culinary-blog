import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCook } from '../api/recipeService';
import RecipeCard from '../components/layout/RecipeCard';

export default function CookPage() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [cook, setCook] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let active = true;
        setStatus('loading');
        getCook(id, i18n.language || 'bg')
            .then((data) => {
                if (!active) return;
                setCook(data);
                setStatus('ready');
            })
            .catch(() => {
                if (active) setStatus('error');
            });
        return () => { active = false; };
    }, [id, i18n.language]);

    if (status === 'loading') return <p className="encyclopedia">{t('encyclopedia_loading')}</p>;
    if (status === 'error' || !cook) {
        return <p className="encyclopedia">{t('cook_missing')}</p>;
    }

    const recipes = Array.isArray(cook.recipes) ? cook.recipes : [];

    return (
        <section className="encyclopedia">
            <h1>{cook.displayName}</h1>
            {cook.bio && <p className="encyclopedia-intro">{cook.bio}</p>}
            <p className="recipe-category">{t('cook_recipe_count', { count: cook.recipeCount ?? recipes.length })}</p>
            {recipes.length === 0 && <p>{t('cook_empty')}</p>}
            <div className="recipe-grid">
                {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </section>
    );
}
