import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RecipeList from '../components/layout/RecipeList';
import { featuredRecipes, popularRecipes, listRecipes } from '../api/recipeService';

export default function HomePage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [featured, setFeatured] = useState([]);
    const [popular, setPopular] = useState([]);
    const [latest, setLatest] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            featuredRecipes(lang).catch(() => []),
            popularRecipes(lang).catch(() => []),
            listRecipes({ lang, pageSize: 12, sort: 'newest' }).catch(() => ({ items: [] }))
        ])
            .then(([feat, pop, page]) => {
                setFeatured(Array.isArray(feat) ? feat : []);
                setPopular(Array.isArray(pop) ? pop : []);
                setLatest(page?.items ?? (Array.isArray(page) ? page : []));
            })
            .finally(() => setLoading(false));
    }, [lang]);

    if (loading) {
        return <p className="loading">{t('loading') || 'Зареждане...'}</p>;
    }

    return (
        <main>
            {featured.length > 0 && (
                <section className="home-section">
                    <h2>{t('home_featured') || 'Популярни днес'}</h2>
                    <RecipeList recipes={featured} />
                </section>
            )}
            {popular.length > 0 && (
                <section className="home-section">
                    <h2>{t('home_popular') || 'Най-гледани'}</h2>
                    <RecipeList recipes={popular} />
                </section>
            )}
            <section className="home-section">
                <h2>{t('home_latest') || 'Новите рецепти'}</h2>
                <RecipeList recipes={latest} />
            </section>
        </main>
    );
}
