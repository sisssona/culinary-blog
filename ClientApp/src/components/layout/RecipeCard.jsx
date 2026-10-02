import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RecipeCard({ recipe }) {
    const { t } = useTranslation();

    return (
        <div className="recipe-card">
            <Link to={`/recipes/${recipe.id}`} className="recipe-image-wrapper">
                <img
                    src={recipe.thumbnailUrl || recipe.imageUrl || '/default-recipe.jpg'}
                    alt={recipe.title}
                    className="recipe-image"
                />
            </Link>

            <div className="recipe-content">
                <h3 className="recipe-title">{recipe.title}</h3>

                <p className="recipe-category">
                    📂 {recipe.category || t('no_category') || 'Без категория'}
                </p>

                <p className="recipe-description">
                    {recipe.description?.slice(0, 100) || t('no_description') || 'Няма описание.'}{recipe.description?.length > 100 ? '...' : ''}
                </p>

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-tags">
                        {recipe.tags.map((tag) => (
                            <Link
                                key={tag.id}
                                to={`/recipes?tag=${tag.slug}`}
                                className="tag-chip"
                                onClick={(e) => e.stopPropagation()}
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                )}

                <Link to={`/recipes/${recipe.id}`} className="recipe-button">
                    {t('btn_view_more') || 'Виж повече →'}
                </Link>
            </div>
        </div>
    );
}