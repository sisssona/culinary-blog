import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function RecipeDetail({ lang }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { token } = useAuth();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`/recipes/${id}?lang=${lang}`)
            .then((res) => setRecipe(res.data))
            .catch((err) => {
                console.error("Грешка при зареждане на рецептата:", err);
                setError("Не успяхме да заредим рецептата.");
            })
            .finally(() => setLoading(false));
    }, [id, lang]);

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete') || "Сигурни ли сте, че искате да изтриете тази рецепта?")) {
            return;
        }

        try {
            await api.delete(`/recipes/${id}`);
            navigate('/'); // Променено от '/recipes' на '/'
        } catch (err) {
            console.error("Грешка при изтриване:", err);
            alert("Грешка при изтриване на рецептата.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        // /uploads/xxxx.webp -> http://localhost:5000/uploads/xxxx.webp
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;
    if (!recipe) return <p style={{ textAlign: 'center', padding: '2rem' }}>Рецептата не е намерена.</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            {/* Навигация и контролни бутони */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                    ← Обратно към всички рецепти
                </Link>

                {token && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => navigate(`/recipes/${id}/edit`)}
                            style={{
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ✏️ Редактирай
                        </button>
                        <button
                            onClick={handleDelete}
                            style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🗑️ Изтрий
                        </button>
                    </div>
                )}
            </div>

            <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', wordBreak: 'break-word' }}>{recipe.title}</h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Категория: <strong>{recipe.category}</strong></p>

            {recipe.imageUrl && (
                <img
                    src={getImageUrl(recipe.imageUrl)}
                    alt={recipe.title}
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', marginBottom: '2rem' }}
                />
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h3>Съставки:</h3>
                <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: '1.6' }}>
                    {recipe.ingredients}
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Инструкции:</h3>
                <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: '1.6' }}>
                    {recipe.instructions}
                </div>
            </div>
        </div>
    );
}