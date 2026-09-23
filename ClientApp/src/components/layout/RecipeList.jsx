import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes }) {
    if (!recipes || recipes.length === 0) {
        return <p>Няма рецепти.</p>;
    }

    return (
        <div className="recipe-grid">
            {recipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
            ))}
        </div>
    );
}
