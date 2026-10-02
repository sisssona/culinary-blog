import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CategorySelect from '../components/CategorySelect';
import ImageDropzone from '../components/ImageDropzone';
import TagInput from '../components/TagInput';
import RecipeGuidelines from '../components/RecipeGuidelines';

const MIN_TAGS = 3;
const MAX_TAGS = 6;

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
    const [selectedTags, setSelectedTags] = useState([]);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const abortControllerRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (selectedTags.length < MIN_TAGS || selectedTags.length > MAX_TAGS) {
            setError(`Моля, изберете между ${MIN_TAGS} и ${MAX_TAGS} тага за рецептата.`);
            return;
        }

        if (!agreedToTerms) {
            setError('Моля, потвърдете условията за публикуване, преди да продължите.');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        abortControllerRef.current = new AbortController();

        try {
            // Парсиране на съставките от текстовото поле в обектен масив (ако е необходимо за бекенда)
            const parsedIngredients = ingredients
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    // Опитваме се да разделим количество и име (напр. "2 яйца" -> Amount: "2", Name: "яйца")
                    const match = line.match(/^([\d\u00BC-\u00BE\u2152-\u215E\/.,\s-]+)?(.*)$/);
                    return {
                        Amount: match && match[1] ? match[1].trim() : '',
                        Name: match && match[2] ? match[2].trim() : line
                    };
                });

            // Парсиране на стъпките за готвене
            const parsedSteps = instructions
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map((text, index) => ({
                    SortOrder: index + 1,
                    Text: text,
                    ImageUrl: null
                }));

            const formData = new FormData();
            formData.append('Title', title);
            formData.append('CategoryId', categoryId);
            formData.append('Ingredients', ingredients);
            formData.append('Instructions', instructions);
            formData.append('IngredientsJson', JSON.stringify(parsedIngredients));
            formData.append('StepsJson', JSON.stringify(parsedSteps));
            formData.append('PrepTimeMinutes', prepTimeMinutes);
            formData.append('CookTimeMinutes', cookTimeMinutes);
            formData.append('Servings', servings);
            formData.append('Difficulty', difficulty);
            formData.append('AgreedToTerms', agreedToTerms);
            formData.append('TagsJson', JSON.stringify(selectedTags.map((t) => t.id)));

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
            const serverMessage = err.response?.data?.error;
            setError(serverMessage || 'Грешка при запис на рецептата.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Добавяне на нова рецепта</h2>

            <RecipeGuidelines />

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

                    <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />

                    <div className="form-group">
                        <label>Продукти:</label>
                        <p className="field-hint">Пишете всеки продукт на отделен ред, напр. "2 яйца" или "200 г брашно".</p>
                        <textarea
                            className="form-input"
                            rows="12"
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Начин на приготвяне:</label>
                        <p className="field-hint">Пишете всяка стъпка на отделен ред — ще се номерират автоматично.</p>
                        <textarea
                            className="form-input"
                            rows="14"
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

                {/* Условия за публикуване */}
                <div className="form-group terms-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 'normal', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            style={{ marginTop: '4px' }}
                            required
                        />
                        <span>
                            Потвърждавам, че тази рецепта и качените снимки са мое собствено съдържание (или имам право да ги публикувам),
                            не нарушават авторски права на трети лица и предоставям на „Вкусни Рецепти“ право да ги показва публично на сайта.
                            Разбирам, че рецептата ще бъде публикувана веднага и че администраторите могат да я премахнат по всяко време,
                            ако не отговаря на правилата на общността. Приемам, че рецептите в сайта са публикувани от потребители и не са
                            професионално проверени — отговорността при алергии, хранителна безопасност и резултат от готвенето е моя.
                        </span>
                    </label>
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