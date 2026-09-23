import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RecipeList from "../components/layout/RecipeList";
import { getAllRecipes } from '../api/recipeService';

export default function HomePage() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'bg';

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        getAllRecipes(currentLang)
            .then((data) => setRecipes(data))
            .finally(() => setLoading(false));
    }, [currentLang]);

    if (loading) {
        return <p>Зареждане...</p>;
    }

    return (
        <main>
            <RecipeList recipes={recipes} />
        </main>
    );
}
