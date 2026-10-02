import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listRecipes } from '../api/recipeService';

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

    // Стейтове за пагинацията
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalItems, setTotalItems] = useState(0);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    // Връщаме се на страница 1, когато категорията или тагът се сменят
    useEffect(() => {
        setPage(1);
    }, [category, tag, q]);

    useEffect(() => {
        setLoading(true);

        listRecipes({ page, pageSize, lang, category, tag, q })
            .then((data) => {
                // Подсигуряваме се спрямо различните формати, които бекендът може да върне (PagedResult или директен масив)
                const recipeData = data?.items || data;

                if (Array.isArray(recipeData)) {
                    setRecipes(recipeData);
                    if (data?.total !== undefined) {
                        setTotalItems(data.total);
                    }
                } else {
                    setRecipes([]);
                }
            })
            .catch((err) => {
                console.error("Грешка при вземане на рецептите:", err);
                setError("Не успяхме да заредим рецептите.");
            })
            .finally(() => setLoading(false));
    }, [page, pageSize, lang, category, tag, q]);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading && recipes.length === 0) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;
    if (!loading && (!recipes || recipes.length === 0)) return <p style={{ textAlign: 'center', padding: '2rem' }}>Няма намерени рецепти.</p>;

    return (
        <div>
            {/* Мрежата с рецепти */}
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {recipes.map((recipe) => (
                    <div key={recipe.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <img
                            src={getImageUrl(recipe.thumbnailUrl || recipe.imageUrl)}
                            alt={recipe.title}
                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '15px', flexGrow: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{recipe.title}</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 15px 0' }}>{recipe.category}</p>

                            {recipe.tags && recipe.tags.length > 0 && (
                                <div className="recipe-tags">
                                    {recipe.tags.map((t) => (
                                        <Link
                                            key={t.id}
                                            to={`/recipes?tag=${t.slug}`}
                                            className="tag-chip"
                                        >
                                            #{t.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link to={`/recipes/${recipe.id}`} style={{ color: '#008CBA', textDecoration: 'none', fontWeight: 'bold' }}>
                                {t('btn_view_more') || 'Виж повече →'}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Бутони за пагинация */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px', padding: '10px' }}>
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1 || loading}
                    style={{ padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                    {t('btn_previous') || '← Предишна'}
                </button>

                <span>
                    Страница <strong>{page}</strong> от <strong>{totalPages}</strong>
                </span>

                <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page >= totalPages || loading}
                    style={{ padding: '8px 16px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                    {t('btn_next') || 'Следваща →'}
                </button>
            </div>
        </div>
    );
}
