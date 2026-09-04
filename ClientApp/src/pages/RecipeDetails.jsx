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

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011';

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
            navigate('/recipes');
        } catch (err) {
            console.error("Грешка при изтриване:", err);
            alert("Грешка при изтриване на рецептата.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;

        let cleanPath = imagePath.replace(/^\/api\/v1/, '');
        cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        const hostUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');
        return `${hostUrl}${cleanPath}`;
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Зареждане...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>{error}</p>;
    if (!recipe) return <p style={{ textAlign: 'center', padding: '2rem' }}>Рецептата не е намерена.</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            {/* Навигация и контролни бутони */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Link to="/recipes" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
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
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '2rem' }}
                />
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h3>Съставки:</h3>
                {/* Стилът за пренасяне е приложен и тук */}
                <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: '1.6' }}>
                    {recipe.ingredients}
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Инструкции:</h3>
                {/* Тук е фиксът за пренасянето на новите редове и дългите думи */}
                <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', lineHeight: '1.6' }}>
                    {recipe.instructions}
                </div>
            </div>
        </div>
    );
}