import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function RecipeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';
    const { token, user, isAdmin } = useAuth();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Състояния за коментари и оценки
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        api.get(`/recipes/${id}`, { params: { lang } })
            .then((res) => {
                const data = res.data;
                setRecipe(data);
                setComments(data.comments || []);

                // Изчисляване на средна оценка и брой гласове
                if (data.ratings && data.ratings.length > 0) {
                    const sum = data.ratings.reduce((acc, r) => acc + r.value, 0);
                    setAvgRating((sum / data.ratings.length).toFixed(1));
                    setRatingCount(data.ratings.length);

                    if (user) {
                        const existingRating = data.ratings.find(r => r.userId === user.id);
                        if (existingRating) {
                            setUserRating(existingRating.value);
                        }
                    }
                }
            })
            .catch(() => setError(t('error_loading_recipe') || 'Не успяхме да заредим рецептата.'))
            .finally(() => setLoading(false));
    }, [id, lang, t, user]);

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete') || 'Сигурни ли сте, че искате да изтриете тази рецепта?')) return;

        try {
            await api.delete(`/recipes/${id}`);
            navigate('/');
        } catch {
            alert(t('error_deleting_recipe') || 'Грешка при изтриване на рецептата.');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await api.post(`/recipes/${id}/comments`, { content: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
        } catch {
            alert(t('error_posting_comment') || 'Грешка при изпращане на коментара.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Сигурни ли сте, че искате да изтриете този коментар?')) return;

        try {
            await api.delete(`/recipes/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId));
        } catch {
            alert('Грешка при изтриване на коментара.');
        }
    };

    const handleRatingChange = async (value) => {
        try {
            const res = await api.post(`/recipes/${id}/rate`, { value });
            setUserRating(value);
            setAvgRating(res.data.ratingAverage);
            setRatingCount(res.data.ratingCount);
            alert(t('ratings.success', 'Оценката е записана успешно!'));
        } catch {
            alert(t('error_rating', 'Грешка при запис на оценката.'));
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    // Проверка дали текущият потребител е администратор или автор на рецептата
    const canManage = user && recipe && (isAdmin || recipe.authorId === user.id);

    if (loading) return <p className="loading">{t('loading') || 'Зареждане на рецепти...'}</p>;
    if (error) return <p className="error">{error}</p>;
    if (!recipe) return <p className="error">{t('recipe_not_found') || 'Рецептата не е намерена.'}</p>;

    return (
        <div className="recipe-details">

            <div className="recipe-details-header">
                <Link to="/" className="back-link">{t('back_to_all') || '← Обратно към всички рецепти'}</Link>

                {canManage && (
                    <div className="recipe-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => navigate(`/recipes/${id}/edit`)}
                            style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            ✏️ {t('edit') || 'Редактирай'}
                        </button>
                        <button
                            onClick={handleDelete}
                            style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #f87171',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            🗑️ {t('delete') || 'Изтрий'}
                        </button>
                    </div>
                )}
            </div>

            <h1 className="recipe-title">{recipe.title}</h1>

            <div className="recipe-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', color: 'var(--text, #666)', fontSize: '0.9rem', marginBottom: '15px' }}>
                <span>📂 {recipe.category}</span>
                {recipe.authorName && (
                    <span>👨‍🍳 {t('recipe.author_label', 'Автор:')} <strong>{recipe.authorName}</strong></span>
                )}
                {recipe.createdAt && (
                    <span>📅 {new Date(recipe.createdAt).toLocaleDateString()}</span>
                )}
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
                <div className="recipe-tags recipe-tags-details">
                    {recipe.tags.map((tag) => (
                        <Link key={tag.id} to={`/recipes?tag=${tag.slug}`} className="tag-chip">
                            #{lang === 'bg' ? tag.name : (tag.nameEn || tag.name)}
                        </Link>
                    ))}
                </div>
            )}

            {recipe.imageUrl && (
                <img
                    src={getImageUrl(recipe.imageUrl)}
                    alt={recipe.title}
                    className="recipe-image"
                />
            )}

            <section className="recipe-section">
                <h3>{t('ingredients') || 'Съставки'}</h3>
                <p className="recipe-text">{recipe.ingredients}</p>
            </section>

            <section className="recipe-section">
                <h3>{t('instructions') || 'Инструкции'}</h3>
                <p className="recipe-text">{recipe.instructions}</p>
            </section>

            {/* Секция за Оценки */}
            <section className="recipe-section ratings-section" style={{ marginTop: '30px', borderTop: '1px solid var(--border, #eee)', paddingTop: '20px' }}>
                <h3>{t('ratings.title', 'Оценка на рецептата')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        ⭐ {avgRating} / 5 <span style={{ fontWeight: 'normal', fontSize: '0.9rem', color: 'var(--text, #666)' }}>({ratingCount} гласа)</span>
                    </span>
                    {token && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.9rem' }}>{t('ratings.yourRating', 'Вашата оценка:')}</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingChange(star)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.4rem',
                                        color: star <= userRating ? '#f39c12' : 'var(--border, #ccc)',
                                        padding: '0 2px'
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Секция за Коментари */}
            <section className="recipe-section comments-section" style={{ marginTop: '30px', borderTop: '1px solid var(--border, #eee)', paddingTop: '20px' }}>
                <h3>{t('comments.title', 'Коментари')}</h3>

                {token ? (
                    <form onSubmit={handleCommentSubmit} style={{ marginBottom: '25px' }}>
                        <textarea
                            className="form-input"
                            rows="3"
                            placeholder={t('comments.placeholder', 'Напишете вашия коментар тук...')}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                            style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '4px', border: '1px solid var(--border, #ccc)', background: 'var(--bg, #fff)', color: 'var(--text-h, #222)' }}
                        />
                        <button type="submit" className="btn blue">
                            {t('comments.submit', 'Публикувай коментар')}
                        </button>
                    </form>
                ) : (
                    <p style={{ fontStyle: 'italic', color: 'var(--text, #666)', marginBottom: '20px' }}>
                        {t('comments.loginRequired', 'Трябва да влезете в профила си, за да коментирате.')}
                    </p>
                )}

                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p style={{ color: 'var(--text, #666)' }}>{t('comments.noComments', 'Все още няма коментари. Бъдете първият, който ще коментира!')}</p>
                    ) : (
                        comments.map((comment) => {
                            const canDeleteComment = user && (isAdmin || comment.userId === user.id);
                            return (
                                <div key={comment.id} className="comment-item" style={{ borderBottom: '1px solid var(--border, #eee)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-h, #222)' }}>
                                            {comment.authorName || 'Потребител'}
                                            <span style={{ fontWeight: 'normal', fontSize: '0.75rem', color: '#888', marginLeft: '10px' }}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h, #222)' }}>{comment.content}</p>
                                    </div>
                                    {canDeleteComment && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#dc2626',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                padding: '4px 8px',
                                                fontWeight: '500'
                                            }}
                                            title="Изтрий коментара"
                                        >
                                            🗑️ Изтрий
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
