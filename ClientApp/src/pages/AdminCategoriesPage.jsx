import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function AdminCategoriesPage() {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/v1/categories')
            .then(res => setCategories(res.data))
            .catch(() => setError('Грешка при зареждане на категориите.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="loading">Зареждане...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="admin-container">
            <h2>Админ панел — категории</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Име</th>
                        <th>Slug</th>
                        <th>Ред</th>
                        <th>Брой рецепти</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td>{lang === 'bg' ? cat.name : cat.nameEn}</td>
                            <td>{cat.slug}</td>
                            <td>{cat.sortOrder}</td>
                            <td>{cat.recipeCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
