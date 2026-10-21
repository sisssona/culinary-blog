import { useTranslation } from 'react-i18next';
import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes }) {
    const { t } = useTranslation();

    if (!recipes || recipes.length === 0) {
        return <p className="no-recipes-message">{t('no_recipes', 'Няма намерени рецепти.')}</p>;
    }

    return (
        <div className="recipe-grid">
            {recipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
            ))}
        </div>
    );
}
