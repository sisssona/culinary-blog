import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CategorySelect from '../components/CategorySelect';
import ImageDropzone from '../components/ImageDropzone';

export default function AddRecipePage() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [instructions, setInstructions] = useState('');
    const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
    const [cookTimeMinutes, setCookTimeMinutes] = useState(30);
    const [servings, setServings] = useState(4);
    const [difficulty, setDifficulty] = useState('medium');

    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const abortControllerRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUploadProgress(0);

        abortControllerRef.current = new AbortController();

        try {
            const formData = new FormData();
            formData.append('Title', title);
            formData.append('CategoryId', categoryId);
            formData.append('Ingredients', ingredients);
            formData.append('Instructions', instructions);
            formData.append('PrepTimeMinutes', prepTimeMinutes);
            formData.append('CookTimeMinutes', cookTimeMinutes);
            formData.append('Servings', servings);
            formData.append('Difficulty', difficulty);

            if (imageFile) {
                formData.append('ImageFile', imageFile);
            }

            await api.post('/recipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal,
                onUploadProgress: (e) => {
                    if (e.total) {
                        setUploadProgress(Math.round((e.loaded * 100) / e.total));
                    }
                }
            });

            navigate('/');
        } catch (err) {
            setError('Грешка при запис на рецептата.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Добавяне на нова рецепта</h2>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleSubmit} className="form-grid">

                {/* Лява колона */}
                <div className="form-column">
                    <div className="form-group">
                        <label>Заглавие:</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <CategorySelect
                        value={categoryId}
                        onChange={setCategoryId}
                    />

                    <div className="form-group">
                        <label>Продукти:</label>
                        <textarea
                            className="form-input"
                            rows="6"
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Начин на приготвяне:</label>
                        <textarea
                            className="form-input"
                            rows="8"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Дясна колона */}
                <div className="form-column">
                    <div className="form-group">
                        <label>Време за подготовка (мин):</label>
                        <input
                            type="number"
                            className="form-input"
                            value={prepTimeMinutes}
                            onChange={(e) => setPrepTimeMinutes(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Време за готвене (мин):</label>
                        <input
                            type="number"
                            className="form-input"
                            value={cookTimeMinutes}
                            onChange={(e) => setCookTimeMinutes(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Порции:</label>
                        <input
                            type="number"
                            className="form-input"
                            value={servings}
                            onChange={(e) => setServings(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Трудност:</label>
                        <select
                            className="form-input"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="easy">Лесно</option>
                            <option value="medium">Средно</option>
                            <option value="hard">Трудно</option>
                        </select>
                    </div>

                    <ImageDropzone onFileSelect={setImageFile} />

                    {loading && (
                        <div className="progress-box">
                            <div className="progress-info">
                                <span>{uploadProgress < 100 ? 'Качване...' : 'Обработка...'}</span>
                                <span>{uploadProgress}%</span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>

                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => abortControllerRef.current?.abort()}
                            >
                                Отказ
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Изпращане...' : 'Публикувай рецептата'}
                </button>
            </form>
        </div>
    );
}
