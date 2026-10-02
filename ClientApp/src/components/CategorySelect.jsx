import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../api/recipeService';

export default function CategorySelect({ value, onChange }) {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [categories, setCategories] = useState([]);
    const [parentId, setParentId] = useState('');

    useEffect(() => {
        getCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : data.items ?? []))
            .catch(() => setCategories([]));
    }, []);

    const label = (cat) => (lang === 'bg' ? cat.name : (cat.nameEn || cat.name));

    const selectedParent = categories.find((c) => String(c.id) === String(parentId));
    const hasSubCategories = selectedParent?.subCategories && selectedParent.subCategories.length > 0;

    const handleParentChange = (newParentId) => {
        setParentId(newParentId);
        // By default, selecting a parent with no subcategories sets the final
        // CategoryId directly. If it has subcategories, wait for the second
        // dropdown instead of submitting the parent id right away.
        const parent = categories.find((c) => String(c.id) === String(newParentId));
        const stillHasChildren = parent?.subCategories && parent.subCategories.length > 0;
        onChange(stillHasChildren ? '' : newParentId);
    };

    return (
        <div className="form-group">
            <label>Категория:</label>
            <select
                className="form-input"
                value={parentId}
                onChange={(e) => handleParentChange(e.target.value)}
                required
            >
                <option value="">Изберете категория</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {label(cat)}
                    </option>
                ))}
            </select>

            {hasSubCategories && (
                <>
                    <label style={{ marginTop: '8px' }}>Подкатегория:</label>
                    <select
                        className="form-input"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        required
                    >
                        <option value="">Изберете подкатегория</option>
                        {selectedParent.subCategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {label(sub)}
                            </option>
                        ))}
                    </select>
                </>
            )}
        </div>
    );
}
