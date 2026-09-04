import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRecipes } from '../api/recipeService';
import api from '../api/axios';

export default function MyRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011';

    useEffect(() => {
        getMyRecipes()
            .then((data) => setRecipes(data))
            .catch((err) => console.error('Грешка при зареждане на рецептите:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (recipeId) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете тази рецепта?")) {
            return;
        }

        try {
            await api.delete(`/recipes/${recipeId}`);
            alert("Рецептата и снимките бяха изтрити успешно!");

            setRecipes(prev => prev.filter(r => r.id !== recipeId));
        } catch (err) {
            console.error("Грешка при изтриване:", err);
            alert("Възникна грешка при изтриването на рецептата.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/300x200?text=Няма+снимка';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${BASE_URL}${cleanPath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане на вашите рецепти...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>Моите качени рецепти</h2>
            {recipes.length === 0 ? (
                <p>Все още нямате качени рецепти.</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {recipes.map((recipe) => (
                        <div key={recipe.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <img src={getImageUrl(recipe.thumbnailUrl || recipe.imageUrl)} alt={recipe.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                                <h3>{recipe.title}</h3>
                                <p>Категория: <strong>{recipe.category}</strong></p>
                                <p>Статус: <span style={{ color: recipe.status === 'approved' ? 'green' : 'orange', fontWeight: 'bold' }}>{recipe.status}</span></p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <Link to={`/recipes/${recipe.id}/edit`} style={{ flex: 1 }}>
                                    <button style={{ width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                        ✏️ Редактирай
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(recipe.id)}
                                    style={{ flex: 1, backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    🗑️ Изтрий
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}