import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteComment, deleteRecipe, listCommentsForModeration, listRecipes } from '../api/recipeService';

const sectionStyle = {
    background: 'var(--bg, #fff)',
    color: 'var(--text-h, #222)',
    border: '1px solid var(--border, #ddd)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
};

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid var(--border, #eee)'
};

const removeButtonStyle = {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #f87171',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    flexShrink: 0
};

export default function AdminModerationPage() {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [busyId, setBusyId] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [recipePage, commentList] = await Promise.all([
                listRecipes({ page: 1, pageSize: 30, sort: 'newest' }),
                listCommentsForModeration()
            ]);
            setRecipes(recipePage?.items || recipePage || []);
            setComments(Array.isArray(commentList) ? commentList : []);
        } catch {
            setError(t('admin_moderation_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const removeRecipe = async (recipe) => {
        if (!window.confirm(t('admin_moderation_confirm_recipe'))) return;
        setBusyId(`recipe-${recipe.id}`);
        setMessage('');
        setError('');
        try {
            await deleteRecipe(recipe.id);
            setRecipes((current) => current.filter((item) => item.id !== recipe.id));
            setComments((current) => current.filter((item) => item.recipeId !== recipe.id));
            setMessage(t('admin_moderation_removed_recipe'));
        } catch {
            setError(t('admin_moderation_error'));
        } finally {
            setBusyId('');
        }
    };

    const removeComment = async (comment) => {
        if (!window.confirm(t('admin_moderation_confirm_comment'))) return;
        setBusyId(`comment-${comment.id}`);
        setMessage('');
        setError('');
        try {
            await deleteComment(comment.id);
            setComments((current) => current.filter((item) => item.id !== comment.id));
            setMessage(t('admin_moderation_removed_comment'));
        } catch {
            setError(t('admin_moderation_error'));
        } finally {
            setBusyId('');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
            <h1 style={{ marginBottom: '8px' }}>{t('admin_moderation_title')}</h1>
            <p style={{ color: 'var(--text, #555)', marginTop: 0 }}>{t('admin_moderation_intro')}</p>

            {message && (
                <p style={{ background: '#dcfce7', color: '#166534', padding: '10px 12px', borderRadius: '6px' }}>{message}</p>
            )}
            {error && (
                <p style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '6px' }}>{error}</p>
            )}
            {loading && <p>{t('loading')}</p>}

            {!loading && (
                <>
                    <section style={sectionStyle}>
                        <h2 style={{ marginTop: 0 }}>{t('admin_moderation_recipes')}</h2>
                        {recipes.length === 0 && <p>{t('admin_moderation_empty_recipes')}</p>}
                        {recipes.map((recipe) => (
                            <div key={recipe.id} style={rowStyle}>
                                <div>
                                    <Link to={`/recipes/${recipe.slug || recipe.id}`}>{recipe.title}</Link>
                                    <div style={{ color: 'var(--text, #666)', fontSize: '0.9rem' }}>
                                        {recipe.authorName} · {new Date(recipe.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={removeButtonStyle}
                                    disabled={busyId === `recipe-${recipe.id}`}
                                    onClick={() => removeRecipe(recipe)}
                                >
                                    {t('admin_moderation_remove')}
                                </button>
                            </div>
                        ))}
                    </section>

                    <section style={sectionStyle}>
                        <h2 style={{ marginTop: 0 }}>{t('admin_moderation_comments')}</h2>
                        {comments.length === 0 && <p>{t('admin_moderation_empty_comments')}</p>}
                        {comments.map((comment) => (
                            <div key={comment.id} style={rowStyle}>
                                <div>
                                    <strong>{comment.authorName}</strong>
                                    <span style={{ color: 'var(--text, #666)', marginLeft: '8px', fontSize: '0.85rem' }}>
                                        {comment.recipeTitle}
                                    </span>
                                    <p style={{ margin: '6px 0 0' }}>{comment.content}</p>
                                </div>
                                <button
                                    type="button"
                                    style={removeButtonStyle}
                                    disabled={busyId === `comment-${comment.id}`}
                                    onClick={() => removeComment(comment)}
                                >
                                    {t('admin_moderation_remove')}
                                </button>
                            </div>
                        ))}
                    </section>
                </>
            )}
        </div>
    );
}
