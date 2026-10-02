import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../api/recipeService';

export default function AdminCategoriesPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        getCategories()
            .then(res => {
                setCategories(Array.isArray(res) ? res : res.data || []);
            })
            .catch(() => setError(t('error_loading_categories') || 'Грешка при зареждане на категориите.'))
            .finally(() => setLoading(false));
    }, [t]);

    if (loading) return <p className="loading">{t('loading') || 'Зареждане...'}</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="admin-container">
            <h2>{t('admin_categories_title') || 'Админ панел — категории'}</h2>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>{t('admin_column_name') || 'Име'}</th>
                        <th>Slug</th>
                        <th>{t('admin_column_order') || 'Ред'}</th>
                        <th>{t('admin_column_recipe_count') || 'Брой рецепти'}</th>
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