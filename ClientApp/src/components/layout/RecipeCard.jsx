
import { Link } from 'react-router-dom';

export default function RecipeCard({ recipe }) {
    return (
        <div className="recipe-card">
            <Link to={`/recipes/${recipe.id}`} className="recipe-image-wrapper">
                <img
                    src={recipe.imageUrl || '/default-recipe.jpg'}
                    alt={recipe.title}
                    className="recipe-image"
                />
            </Link>

            <div className="recipe-content">
                <h3 className="recipe-title">{recipe.title}</h3>

                <p className="recipe-category">
                    📂 {recipe.category || 'Без категория'}
                </p>

                <p className="recipe-description">
                    {recipe.description?.slice(0, 100) || 'Няма описание.'}...
                </p>

                <Link to={`/recipes/${recipe.id}`} className="recipe-button">
                    Виж повече →
                </Link>
            </div>
        </div>
    );
}
