import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function ImageDropzone({ onFileSelect }) {
    const { t } = useTranslation();
    const [previewUrl, setPreviewUrl] = useState(null);
    const dropRef = useRef(null);

    const handleFiles = (file) => {
        if (!file) return;

        const allowed = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'gif'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowed.includes(ext)) {
            alert(t('recipe.errors.unsupportedFormat', { defaultValue: 'Неподдържан формат!' }));
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert(t('recipe.errors.fileTooLarge', { defaultValue: 'Файлът е над 10MB!' }));
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        onFileSelect(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFiles(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        dropRef.current.classList.add("dropzone-hover");
    };

    const handleDragLeave = () => {
        dropRef.current.classList.remove("dropzone-hover");
    };

    return (
        <div className="form-group">
            <label>{t('recipe.fields.image', { defaultValue: 'Снимка на ястието:' })}</label>

            <div
                ref={dropRef}
                className="dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {t('recipe.dropzoneText', { defaultValue: 'Плъзни снимка тук или избери файл' })}
                <input
                    type="file"
                    accept="image/*"
                    className="dropzone-input"
                    onChange={(e) => handleFiles(e.target.files[0])}
                />
            </div>

            {previewUrl && (
                <div className="image-preview">
                    <img src={previewUrl} alt={t('recipe.previewAlt', { defaultValue: 'Преглед' })} />
                </div>
            )}
        </div>
    );
}