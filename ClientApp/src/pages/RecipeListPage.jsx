import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listRecipes } from '../api/recipeService';
import RecipeList from '../components/layout/RecipeList';

export default function RecipeListPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const q = searchParams.get('q') || undefined;

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [totalItems, setTotalItems] = useState(0);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    useEffect(() => {
        setPage(1);
    }, [category, tag, q]);

    useEffect(() => {
        setLoading(true);
        setError(null);

        listRecipes({ page, pageSize, lang, category, tag, q })
            .then((data) => {
                const recipeData = data?.items || data;
                if (Array.isArray(recipeData)) {
                    setRecipes(recipeData);
                    setTotalItems(data?.total ?? recipeData.length);
                } else {
                    setRecipes([]);
                    setTotalItems(0);
                }
            })
            .catch(() => setError(t('error_loading_recipes')))
            .finally(() => setLoading(false));
    }, [page, pageSize, lang, category, tag, q, t]);

    if (loading && recipes.length === 0) return <p className="loading">{t('loading')}</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div>
            <RecipeList recipes={recipes} />

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px', padding: '10px' }}>
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1 || loading}
                        className="btn"
                    >
                        {t('btn_previous') || '← Предишна'}
                    </button>
                    <span>
                        {t('page_of', { page, total: totalPages }) || `Страница ${page} от ${totalPages}`}
                    </span>
                    <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page >= totalPages || loading}
                        className="btn"
                    >
                        {t('btn_next') || 'Следваща →'}
                    </button>
                </div>
            )}
        </div>
    );
}
