import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecipes } from '../api/recipeService';
import api from '../api/axios';

export default function MyRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyRecipes()
            .then((data) => setRecipes(data))
            .catch((err) => console.error('Грешка при зареждане:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (recipeId) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете тази рецепта?")) return;
        try {
            await api.delete(`/recipes/${recipeId}`);
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
        } catch (err) {
            alert("Грешка при изтриване.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        // /uploads/xxxx.webp -> http://localhost:5000/uploads/xxxx.webp
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>Моите качени рецепти</h2>
            {recipes.length === 0 ? (
                <p>Все още нямате качени рецепти.</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {recipes.map((recipe) => (
                        <div key={recipe.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                            <img
                                src={getImageUrl(recipe.thumbnailUrl || recipe.imageUrl)}
                                alt={recipe.title}
                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                                onError={(e) => { e.target.src = '/no-image.jpg' }}
                            />
                            <h3>{recipe.title}</h3>
                            <p>Категория: <strong>{recipe.category}</strong></p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <Link to={`/recipes/${recipe.id}/edit`} style={{ flex: 1 }}><button style={{ width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px', borderRadius: '4px' }}>✏ Редактирай</button></Link>
                                <button onClick={() => handleDelete(recipe.id)} style={{ flex: 1, backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px', borderRadius: '4px' }}>🗑 Изтрий</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}