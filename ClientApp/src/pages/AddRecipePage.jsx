import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import CategorySelect from '../components/CategorySelect';
import ImageDropzone from '../components/ImageDropzone';
import TagInput from '../components/TagInput';
import IngredientInput, { newRow } from '../components/IngredientInput';

const MIN_TAGS = 3;
const MAX_TAGS = 6;

export default function AddRecipePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredientRows, setIngredientRows] = useState([newRow()]);
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

        const filledRows = ingredientRows.filter((r) => r.name.trim() !== '');
        if (filledRows.length === 0) {
            setError(t('recipe.ingredientsActions.atLeastOne'));
            return;
        }

        if (selectedTags.length < MIN_TAGS || selectedTags.length > MAX_TAGS) {
            setError(t('recipe.errors.tagsCount', { min: MIN_TAGS, max: MAX_TAGS }));
            return;
        }

        if (!agreedToTerms) {
            setError(t('recipe.errors.termsRequired'));
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        abortControllerRef.current = new AbortController();

        try {
            const ingredientsJson = JSON.stringify(
                filledRows.map((r) => ({
                    Amount: [r.amount, r.unit].filter(Boolean).join(' ').trim(),
                    Name: r.name.trim()
                }))
            );

            const formData = new FormData();
            formData.append('Title', title);
            formData.append('CategoryId', categoryId);
            formData.append('IngredientsJson', ingredientsJson);
            formData.append('Instructions', instructions);
            formData.append('PrepTimeMinutes', prepTimeMinutes);
            formData.append('CookTimeMinutes', cookTimeMinutes);
            formData.append('Servings', servings);
            formData.append('Difficulty', difficulty);
            formData.append('AgreedToTerms', agreedToTerms);
            formData.append('TagsJson', JSON.stringify(selectedTags.map((tg) => tg.id)));

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
            setError(serverMessage || t('recipe.errors.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container form-container-single">
            <h2>{t('recipe.addTitle')}</h2>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleSubmit} className="form-stack">

                {/* 1. Снимка */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.photo')}</h3>
                    <ImageDropzone onFileSelect={setImageFile} />
                </section>

                {/* 2. Заглавие + категория */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.basicInfo')}</h3>

                    <div className="form-group">
                        <label>{t('recipe.fields.title')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <CategorySelect value={categoryId} onChange={setCategoryId} />
                </section>

                {/* 3. Продукти */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.ingredientsSection')}</h3>
                    <IngredientInput rows={ingredientRows} onChange={setIngredientRows} />
                </section>

                {/* 4. Начин на приготвяне */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.instructionsSection')}</h3>
                    <div className="form-group">
                        <p className="field-hint">{t('recipe.fields.instructionsHint')}</p>
                        <textarea
                            className="form-input"
                            rows="10"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            required
                        />
                    </div>
                </section>

                {/* 5. Детайли */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.details')}</h3>
                    <div className="form-grid-details">
                        <div className="form-group">
                            <label>{t('recipe.fields.prepTime')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={prepTimeMinutes}
                                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('recipe.fields.cookTime')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={cookTimeMinutes}
                                onChange={(e) => setCookTimeMinutes(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('recipe.fields.servings')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={servings}
                                onChange={(e) => setServings(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('recipe.fields.difficulty')}</label>
                            <select
                                className="form-input"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="easy">{t('recipe.difficulty.easy')}</option>
                                <option value="medium">{t('recipe.difficulty.medium')}</option>
                                <option value="hard">{t('recipe.difficulty.hard')}</option>
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="progress-box">
                            <div className="progress-info">
                                <span>{uploadProgress < 100 ? t('recipe.progress.uploading') : t('recipe.progress.processing')}</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => abortControllerRef.current?.abort()}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    )}
                </section>

                {/* 6. Тагове */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.tagsSection')}</h3>
                    <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />
                </section>

                {/* 7. Условия + публикуване */}
                <section className="form-section">
                    <h3 className="form-section-title">{t('recipe.sections.terms')}</h3>
                    <div className="form-group terms-group">
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 'normal', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                style={{ marginTop: '4px' }}
                                required
                            />
                            <span>{t('recipe.termsText')}</span>
                        </label>
                    </div>

                    <button type="submit" className="btn-submit btn-submit-full" disabled={loading}>
                        {loading ? t('recipe.submitting') : t('recipe.submitButton')}
                    </button>
                </section>
            </form>
        </div>
    );
}
