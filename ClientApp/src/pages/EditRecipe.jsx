import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function EditRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Състояние за прогрес бара
    const [error, setError] = useState('');

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011';
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.gif'];

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await api.get(`/recipes/${id}`);
                const recipe = response.data;

                setTitle(recipe.title || '');
                setCategory(recipe.category || '');
                setIngredients(recipe.ingredients || '');
                setInstructions(recipe.instructions || '');

                if (recipe.imageUrl) {
                    const fullUrl = recipe.imageUrl.startsWith('http')
                        ? recipe.imageUrl
                        : `${BASE_URL}${recipe.imageUrl.startsWith('/') ? '' : '/'}${recipe.imageUrl}`;
                    setPreviewUrl(fullUrl);
                }
            } catch (err) {
                setError('Грешка при зареждане на рецептата.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, BASE_URL]);

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setError('');

        if (!file) {
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            setError(`Позволени са само следните формати: ${ALLOWED_EXTENSIONS.join(', ')}`);
            e.target.value = '';
            return;
        }

        const maxSizeBytes = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSizeBytes) {
            setError('Файлът надвишава максималния размер от 10MB.');
            e.target.value = '';
            return;
        }

        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setUploadProgress(0); // Зануляваме прогреса при старт
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('ingredients', ingredients);
        formData.append('instructions', instructions);

        if (selectedFile) {
            formData.append('imageFile', selectedFile);
        }

        try {
            await api.put(`/recipes/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            });
            navigate(`/recipes/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Грешка при запазване на рецептата.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Зареждане на данните...</div>;
    }

    return (
        <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
            <Link to={`/recipes/${id}`} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                ← Отказ и връщане
            </Link>

            <h2 style={{ color: '#2c3e50', marginTop: '1rem' }}>✏️ Редактиране на рецепта</h2>

            {error && (
                <div style={{ padding: '0.8rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Заглавие:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Категория:</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                        Снимка на ястието (JPG, PNG, WEBP, HEIC, HEIF, AVIF, GIF до 10MB):
                    </label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif,.heic,.heif,.avif,.gif"
                        onChange={handleFileChange}
                        style={{ marginTop: '0.3rem' }}
                    />
                    {previewUrl && (
                        <div style={{ marginTop: '0.8rem' }}>
                            <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#666' }}>Преглед:</p>
                            <img
                                src={previewUrl}
                                alt="Преглед"
                                style={{ width: '160px', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                        Продукти (по един на нов ред):
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
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem' }}>Начин на приготвяне:</label>
                    <textarea
                        rows="8"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                {/* Лента за напредък (Progress Bar) при редакция */}
                {submitting && (
                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>
                                {uploadProgress < 100 ? 'Качване на промените...' : 'Обработка на изображението...'}
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
                    {submitting ? 'Запазване...' : '💾 Запази промените'}
                </button>
            </form>
        </div>
    );
}