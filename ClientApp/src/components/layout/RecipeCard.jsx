import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RecipeCard({ recipe }) {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';
    const tagLabel = (tag) => (lang === 'bg' ? tag.name : (tag.nameEn || tag.name));

    // Проверяваме дали авторът е администраторския екип
    const isEditorial = ['Редакция', 'Culinary team', 'Culinary Team', 'Кулинарен екип'].includes(recipe.authorName);

    // Функция за показване на името на автора според езика, ако е екипът
    const renderAuthorName = () => {
        if (isEditorial) {
            return t('culinary_team', 'Кулинарен екип');
        }

        // Ако имаме английски вариант на името или искаме да го мапнем при нужда
        return recipe.authorName;
    };

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
                    📂 {recipe.category || t('no_category', 'Без категория')}
                </p>

                {recipe.authorName && (
                    <p className="recipe-author" style={{ fontSize: '0.85rem', color: '#666', margin: '5px 0' }}>
                        👨‍🍳 {t('recipe.author_label', 'Автор:')}{' '}
                        <strong>
                            {renderAuthorName()}
                        </strong>
                    </p>
                )}

                {recipe.description && (
                    <p className="recipe-description">
                        {recipe.description.slice(0, 100)}
                        {recipe.description.length > 100 ? '...' : ''}
                    </p>
                )}

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-tags">
                        {recipe.tags.map((tag) => (
                            <Link
                                key={tag.id}
                                to={`/recipes?tag=${tag.slug}`}
                                className="tag-chip"
                                onClick={(e) => e.stopPropagation()}
                            >
                                #{tagLabel(tag)}
                            </Link>
                        ))}
                    </div>
                )}

                <Link to={`/recipes/${recipe.id}`} className="recipe-button">
                    {t('btn_view_more', 'Виж повече →')}
                </Link>
            </div>
        </div>
    );
}
