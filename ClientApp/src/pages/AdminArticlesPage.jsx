import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createArticle, deleteArticle, getArticle, getArticles, mediaUrl, updateArticle } from '../api/recipeService';

const emptyForm = { title: '', body: '' };

export default function AdminArticlesPage() {
    const { t, i18n } = useTranslation();
    const [articles, setArticles] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [removeImage, setRemoveImage] = useState(false);
    const [fileKey, setFileKey] = useState(0);

    useEffect(() => () => {
        if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const load = () => {
        getArticles()
            .then((data) => setArticles(Array.isArray(data) ? data : []))
            .catch(() => setError(t('admin_articles_error')))
            .finally(() => setLoaded(true));
    };

    useEffect(() => { load(); }, []);

    const publishedOn = (value) => {
        if (!value) return '';
        return new Date(value).toLocaleString(i18n.language, { dateStyle: 'long', timeStyle: 'short' });
    };

    const reset = () => {
        setForm(emptyForm);
        setEditing(null);
        setImageFile(null);
        setPreviewUrl('');
        setRemoveImage(false);
        setFileKey((key) => key + 1);
    };

    const onImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
        setRemoveImage(false);
        setPreviewUrl(file ? URL.createObjectURL(file) : (editing?.imageUrl && !removeImage ? mediaUrl(editing.imageUrl) : ''));
    };

    const onRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl('');
        setRemoveImage(true);
        setFileKey((key) => key + 1);
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');
        setSaving(true);
        const payload = {
            title: form.title.trim(),
            excerpt: '',
            body: form.body.trim(),
            image: imageFile,
            removeImage
        };
        try {
            if (editing) {
                await updateArticle(editing.id, payload);
                setStatus(t('admin_articles_updated'));
            } else {
                await createArticle(payload);
                setStatus(t('admin_articles_saved'));
            }
            reset();
            load();
        } catch (err) {
            setError(err.response?.data?.error || t('admin_articles_error'));
        } finally {
            setSaving(false);
        }
    };

    const onEdit = async (article) => {
        setError('');
        setStatus('');
        try {
            const full = await getArticle(article.slug);
            setEditing(full);
            setForm({ title: full.title || '', body: full.body || '' });
            setImageFile(null);
            setRemoveImage(false);
            setPreviewUrl(full.imageUrl ? mediaUrl(full.imageUrl) : '');
            setFileKey((key) => key + 1);
        } catch {
            setError(t('admin_articles_error'));
        }
    };

    const onDelete = async (article) => {
        if (!window.confirm(t('admin_articles_confirm_delete'))) return;
        setError('');
        setStatus('');
        try {
            await deleteArticle(article.id);
            if (editing?.id === article.id) reset();
            setStatus(t('admin_articles_deleted'));
            load();
        } catch {
            setError(t('admin_articles_error'));
        }
    };

    return (
        <div className="admin-articles">
            <h1>{t('admin_articles_title')}</h1>
            <p className="encyclopedia-intro">{t('admin_articles_intro')}</p>

            {status && <p className="admin-articles-ok">{status}</p>}
            {error && <p className="admin-articles-error">{error}</p>}

            <form className="admin-articles-form" onSubmit={onSubmit}>
                <h2>{editing ? t('admin_articles_editing') : t('admin_articles_new')}</h2>
                <label>
                    {t('admin_articles_title_label')}
                    <input
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        maxLength={220}
                        required
                    />
                </label>
                <label>
                    {t('admin_articles_body_label')}
                    <textarea
                        value={form.body}
                        onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                        rows={12}
                        required
                    />
                </label>
                <label>
                    {t('admin_articles_image_label')}
                    <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImageChange} />
                </label>
                <p className="admin-articles-date">{t('admin_articles_image_hint')}</p>
                {previewUrl && (
                    <div className="admin-articles-preview">
                        <img src={previewUrl} alt="" />
                        <button type="button" onClick={onRemoveImage}>{t('admin_articles_image_remove')}</button>
                    </div>
                )}
                <p className="admin-articles-date">
                    {editing?.createdAt
                        ? t('admin_articles_date_kept', { date: publishedOn(editing.createdAt) })
                        : t('admin_articles_date_hint')}
                </p>
                <div className="admin-articles-actions">
                    <button type="submit" disabled={saving}>
                        {editing ? t('admin_articles_save') : t('admin_articles_publish')}
                    </button>
                    {editing && (
                        <button type="button" onClick={reset}>{t('admin_articles_cancel')}</button>
                    )}
                </div>
            </form>

            <h2>{t('admin_articles_list')}</h2>
            {loaded && articles.length === 0 && <p>{t('encyclopedia_empty')}</p>}
            <ul className="admin-articles-list">
                {articles.map((article) => (
                    <li key={article.id}>
                        <div>
                            <strong>{article.title}</strong>
                            <span>{publishedOn(article.createdAt)}</span>
                        </div>
                        <div className="admin-articles-actions">
                            <Link to={`/encyclopedia/${article.slug}`}>{t('admin_articles_open')}</Link>
                            <button type="button" onClick={() => onEdit(article)}>{t('admin_articles_edit')}</button>
                            <button type="button" onClick={() => onDelete(article)}>{t('admin_articles_delete')}</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
