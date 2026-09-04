import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AddRecipePage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Основни');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    // Референция за панене/отмяна на заявката през Axios
    const abortControllerRef = useRef(null);

    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.gif'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

            if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
                setError(`Неподдържан формат! Позволени формати: ${ALLOWED_EXTENSIONS.join(', ')}`);
                setImageFile(null);
                setPreviewUrl(null);
                e.target.value = '';
                return;
            }

            setError('');
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(0);
        setError('');

        // Създаваме AbortController за тази заявка
        abortControllerRef.current = new AbortController();

        try {
            const formData = new FormData();
            formData.append('Title', title);
            formData.append('Category', category);
            formData.append('Ingredients', ingredients);
            formData.append('Instructions', instructions);

            if (imageFile) {
                formData.append('ImageFile', imageFile);
            }

            await api.post('/recipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal, // Свързваме Axios с контролера
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            });

            navigate('/');
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                console.log("Заявката беше отменена от потребителя.");
                setError('Качването беше прекратено.');
            } else {
                console.error("Грешка при запис:", err);
                setError(err.response?.data?.message || 'Грешка при запис на рецептата.');
            }
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Функция за бутон "Отказ" по време на качване
    const handleCancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
            <h2>Добавяне на нова рецепта</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Заглавие:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Категория:</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Продукти (разделени със запетая):</label>
                    <textarea
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Начин на приготвяне:</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows="5"
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Снимка на ястието:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ width: '100%', margin: '8px 0' }}
                    />
                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Преглед"
                            style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                    )}
                </div>

                {/* Лента за напредък (Progress Bar) с бутон за отмяна */}
                {loading && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>
                                {uploadProgress < 100 ? 'Качване на данните...' : 'Обработка...'}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{uploadProgress}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden', height: '10px', marginBottom: '8px' }}>
                            <div
                                style={{
                                    width: `${uploadProgress}%`,
                                    backgroundColor: uploadProgress === 100 ? '#4CAF50' : '#007bff',
                                    height: '100%',
                                    transition: 'width 0.2s ease-in-out',
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleCancelUpload}
                            style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            Отказ на качването
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        backgroundColor: loading ? '#cccccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    {loading ? 'Изпращане...' : 'Публикувай рецептата'}
                </button>
            </form>
        </div>
    );
}