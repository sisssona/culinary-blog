import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const MAX_PHOTOS = 8;
const ALLOWED = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'heic', 'heif', 'avif', 'gif'];

let nextKey = 1;

export default function RecipePhotoPicker({ initialItems = [], onChange }) {
    const { t } = useTranslation();
    const [items, setItems] = useState(() => initialItems.map((item) => ({ ...item, key: nextKey++ })));
    const [removedIds, setRemovedIds] = useState([]);
    const [removedLegacy, setRemovedLegacy] = useState(false);
    const [notice, setNotice] = useState('');
    const itemsRef = useRef(items);
    itemsRef.current = items;

    useEffect(() => {
        onChange({ items, removedIds, removedLegacy });
    }, [items, removedIds, removedLegacy, onChange]);

    useEffect(() => () => {
        itemsRef.current.forEach((item) => {
            if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
        });
    }, []);

    const update = (next) => {
        if (!next.some((item) => item.isCover) && next.length > 0)
            next[0] = { ...next[0], isCover: true };
        setItems(next);
    };

    const addFiles = (fileList) => {
        const accepted = [];
        let rejected = false;
        for (const file of fileList) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!ALLOWED.includes(ext) || file.size > 10 * 1024 * 1024) {
                rejected = true;
                continue;
            }
            accepted.push({
                key: nextKey++,
                id: null,
                file,
                url: URL.createObjectURL(file),
                legacy: false,
                isCover: false
            });
        }
        const room = Math.max(0, MAX_PHOTOS - items.length);
        accepted.slice(room).forEach((item) => {
            if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
        });
        const kept = accepted.slice(0, room);
        if (rejected) setNotice(t('recipe_photos_rejected'));
        else if (accepted.length > room) setNotice(t('recipe_photos_limit'));
        else setNotice('');
        if (kept.length === 0) return;
        update([...items, ...kept]);
    };

    const removeItem = (item) => {
        if (item.id) setRemovedIds((prev) => [...prev, item.id]);
        if (item.legacy) setRemovedLegacy(true);
        if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
        update(items.filter((entry) => entry.key !== item.key));
    };

    return (
        <div className="photo-picker">
            <p className="recipe-video-hint">{t('recipe_photos_hint')}</p>
            <label className="dropzone">
                {t('recipe_photos_add')}
                <input
                    type="file"
                    accept="image/jpeg,.jpg,.jpeg,.jfif,image/png,image/webp,image/gif,image/heic,image/heif,image/avif"
                    multiple
                    className="dropzone-input"
                    onChange={(event) => {
                        addFiles(event.target.files || []);
                        event.target.value = '';
                    }}
                />
            </label>
            {(notice || items.length >= MAX_PHOTOS) && <p className="recipe-video-hint">{notice || t('recipe_photos_limit')}</p>}
            <div className="photo-picker-grid">
                {items.map((item) => (
                    <div key={item.key} className={`photo-picker-item${item.isCover ? ' is-cover' : ''}`}>
                        <img src={item.url} alt="" />
                        <button type="button" onClick={() => update(items.map((entry) => ({ ...entry, isCover: entry.key === item.key })))}>
                            {item.isCover ? t('recipe_photos_cover') : t('recipe_photos_make_cover')}
                        </button>
                        <button type="button" onClick={() => removeItem(item)}>{t('recipe_photos_remove')}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
