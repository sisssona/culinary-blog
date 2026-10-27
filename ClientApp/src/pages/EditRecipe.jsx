import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. Добави импорт
import api from '../api/axios';
import RecipePhotoPicker from '../components/RecipePhotoPicker';

export default function EditRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(); // 2. Извикай хука

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');

    const [videoFile, setVideoFile] = useState(null);
    const [initialPhotos, setInitialPhotos] = useState([]);
    const [photoState, setPhotoState] = useState({ items: [], removedIds: [], removedLegacy: false });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/no-image.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await api.get(`/recipes/${id}`);
                const recipe = response.data;

                setTitle(recipe.title || '');
                setCategory(recipe.category || '');
                setIngredients(recipe.ingredients || '');
                setInstructions(recipe.instructions || '');

                const images = (recipe.media || []).filter((item) => item.mediaType === 'image' && item.state === 'ready' && item.url);
                if (images.length > 0) {
                    setInitialPhotos(images.map((item) => ({
                        id: item.id,
                        url: getImageUrl(item.url),
                        legacy: false,
                        isCover: item.isPrimary || item.url === recipe.imageUrl
                    })));
                } else if (recipe.imageUrl) {
                    setInitialPhotos([{
                        id: null,
                        url: getImageUrl(recipe.imageUrl),
                        legacy: true,
                        isCover: true
                    }]);
                }
            } catch (err) {
                setError(t('error_loading_recipe') || 'Грешка при зареждане на рецептата.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setUploadProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('Title', title);
        formData.append('Category', category);
        formData.append('Ingredients', ingredients);
        formData.append('Instructions', instructions);

        photoState.removedIds.forEach((mediaId) => formData.append('RemoveMediaIds', mediaId));
        if (photoState.removedLegacy) formData.append('RemoveLegacyCover', 'true');
        const newPhotos = photoState.items.filter((item) => item.file);
        newPhotos.forEach((item) => formData.append('Images', item.file));
        const cover = photoState.items.find((item) => item.isCover);
        if (cover?.id) formData.append('CoverMediaId', String(cover.id));
        else if (cover?.file) formData.append('CoverIndex', String(newPhotos.indexOf(cover)));
        if (videoFile) {
            formData.append('Videos', videoFile);
        }

        try {
            await api.put(`/recipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            });
            navigate(`/recipes/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || t('error_saving_recipe') || 'Грешка при запазване на рецептата.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>{t('loading') || 'Зареждане на данните...'}</div>;
    }

    return (
        <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
            <Link to={`/recipes/${id}`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                {t('btn_cancel_and_back') || '← Отказ и връщане'}
            </Link>

            <h2 style={{ color: '#2c3e50', marginTop: '1rem' }}>✏️ {t('edit_recipe_title') || 'Редактиране на рецепта'}</h2>

            {error && (
                <div style={{ padding: '0.8rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>{t('label_title') || 'Заглавие:'}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>{t('category_label') || 'Категория:'}</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                {loading ? null : (
                    <RecipePhotoPicker initialItems={initialPhotos} onChange={setPhotoState} />
                )}

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                        {t('recipe_video_label')}
                    </label>
                    <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: '#666' }}>{t('recipe_video_hint')}</p>
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                        {t('ingredients_title_format') || 'Продукти (по един на нов ред):'}
                    </label>
                    <textarea
                        rows="6"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>{t('instructions_title') || 'Начин на приготвяне:'}</label>
                    <textarea
                        rows="8"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                {submitting && (
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>
                                {uploadProgress < 100 ? (t('uploading_changes') || 'Качване на промените...') : (t('processing_image') || 'Обработка на изображението...')}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{uploadProgress}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden', height: '10px' }}>
                            <div
                                style={{
                                    width: `${uploadProgress}%`,
                                    backgroundColor: uploadProgress === 100 ? '#27ae60' : '#007bff',
                                    height: '100%',
                                    transition: 'width 0.2s ease-in-out',
                                }}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        padding: '0.8rem 1.5rem',
                        backgroundColor: submitting ? '#cccccc' : '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {submitting ? (t('saving') || 'Запазване...') : (`💾 ${t('btn_save_changes') || 'Запази промените'}`)}
                </button>
            </form>
        </div>
    );
}