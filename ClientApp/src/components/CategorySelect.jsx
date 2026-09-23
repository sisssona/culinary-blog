import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function CategorySelect({ value, onChange }) {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get('/v1/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error("Грешка при зареждане на категориите:", err));
    }, []);

    return (
        <div className="form-group">
            <label>Категория:</label>
            <select
                className="form-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
            >
                <option value="">Изберете категория</option>

                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                        {lang === 'bg' ? cat.name : cat.nameEn}
                    </option>
                ))}
            </select>
        </div>
    );
}
