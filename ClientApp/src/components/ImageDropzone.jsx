import { useState, useRef } from 'react';

export default function ImageDropzone({ onFileSelect }) {
    const [previewUrl, setPreviewUrl] = useState(null);
    const dropRef = useRef(null);

    const handleFiles = (file) => {
        if (!file) return;

        const allowed = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'avif', 'gif'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowed.includes(ext)) {
            alert("Неподдържан формат!");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Файлът е над 10MB!");
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
            <label>Снимка на ястието:</label>

            <div
                ref={dropRef}
                className="dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                Плъзни снимка тук или избери файл
                <input
                    type="file"
                    accept="image/*"
                    className="dropzone-input"
                    onChange={(e) => handleFiles(e.target.files[0])}
                />
            </div>

            {previewUrl && (
                <div className="image-preview">
                    <img src={previewUrl} alt="Preview" />
                </div>
            )}
        </div>
    );
}
