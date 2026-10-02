import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // 1. Добави импорта
import RecipeList from "../components/layout/RecipeList";
import { getAllRecipes } from '../api/recipeService';

export default function HomePage() {
    const { t, i18n } = useTranslation(); // 2. Извикай t
    const currentLang = i18n.language || 'bg';

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        getAllRecipes(currentLang)
            .then((data) => setRecipes(data.items ?? data))
            .finally(() => setLoading(false));
    }, [currentLang]);

    if (loading) {
        // 3. Използвай превода за зареждане
        return <p style={{ textAlign: 'center', padding: '2rem' }}>{t('loading') || 'Зареждане...'}</p>;
    }

    return (
        <main>
            <RecipeList recipes={recipes} />
        </main>
    );
}