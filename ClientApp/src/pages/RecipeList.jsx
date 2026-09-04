import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function RecipeList({ lang }) {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011';

    useEffect(() => {
        setLoading(true);
        api.get(`/recipes?lang=${lang}`)
            .then((res) => setRecipes(res.data))
            .catch((err) => {
                console.error("Грешка при вземане на рецептите:", err);
                setError("Не успяхме да заредим рецептите.");
            })
            .finally(() => setLoading(false));
    }, [lang]);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;

        let cleanPath = imagePath.replace(/^\/api\/v1/, '');
        cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        const hostUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');
        return `${hostUrl}${cleanPath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;
    if (recipes.length === 0) return <p style={{ textAlign: 'center', padding: '2rem' }}>Няма рецепти.</p>;

    return (
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
                    </div>
                    <div style={{ padding: '15px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to={`/recipes/${recipe.id}`} style={{ color: '#008CBA', textDecoration: 'none', fontWeight: 'bold' }}>
                            {t('btn_view_more') || 'Виж повече →'}
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}