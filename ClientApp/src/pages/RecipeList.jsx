import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function RecipeList({ lang }) {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        // /uploads/xxxx.webp -> http://localhost:5000/uploads/xxxx.webp
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
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