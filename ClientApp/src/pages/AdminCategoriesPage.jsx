import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

export default function AdminCategoriesPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form state
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [parentCategoryId, setParentCategoryId] = useState('');

    const fetchCategories = () => {
        setLoading(true);
        api.get('/categories/flat')
            .then(res => {
                setFlatCategories(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => setError('Грешка при зареждане на категориите.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const payload = {
            name,
            nameEn,
            sortOrder: parseInt(sortOrder) || 0,
            parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : null
        };

        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, payload);
                setSuccessMessage('Категорията е обновена успешно!');
            } else {
                await api.post('/categories', payload);
                setSuccessMessage('Категорията е създадена успешно!');
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Възникна грешка при запазване.');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setNameEn('');
        setSortOrder(0);
        setParentCategoryId('');
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setName(cat.name);
        setNameEn(cat.nameEn || '');
        setSortOrder(cat.sortOrder || 0);
        setParentCategoryId(cat.parentCategoryId || '');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Сигурни ли сте, че искате да изтриете тази категория?')) return;
        try {
            await api.delete(`/categories/${id}`);
            setSuccessMessage('Категорията е изтрита успешно!');
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Грешка при изтриване.');
        }
    };

    const parentOptions = flatCategories.filter(c => !c.parentCategoryId && c.id !== editingId);

    const organizedCategories = [];
    const parents = flatCategories.filter(c => !c.parentCategoryId);

    parents.forEach(parent => {
        organizedCategories.push({ ...parent, level: 0 });
        const subs = flatCategories.filter(c => c.parentCategoryId === parent.id);
        subs.forEach(sub => {
            organizedCategories.push({ ...sub, level: 1 });
        });
    });

    flatCategories.forEach(cat => {
        if (!organizedCategories.some(oc => oc.id === cat.id)) {
            organizedCategories.push({ ...cat, level: 0 });
        }
    });

    if (loading && flatCategories.length === 0) return <p className="loading">Зареждане...</p>;

    return (
        <div className="admin-container" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'inherit' }}>
            <h2 style={{ marginBottom: '20px', color: '#222' }}>📁 Админ панел — Управление на категории</h2>

            {successMessage && <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #c3e6cb' }}>{successMessage}</div>}
            {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #f5c6cb' }}>{error}</div>}

            {/* Форма за добавяне / редакция */}
            <form onSubmit={handleSubmit} style={{ background: '#fdfbf7', padding: '24px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #e3decb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#b45309', fontSize: '1.1rem' }}>
                    {editingId ? '✏️ Редактиране на категория' : '➕ Добавяне на нова категория'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 80px auto', gap: '15px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Име (БГ):</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Име (EN):</label>
                        <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Родителска категория:</label>
                        <select value={parentCategoryId} onChange={e => setParentCategoryId(e.target.value)} style={{ width: '100%', padding: '10.5px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', fontSize: '0.95rem' }}>
                            <option value="">— Основна категория (Няма) —</option>
                            {parentOptions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#444' }}>Ред:</label>
                        <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" style={{ background: '#b45309', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)' }} onMouseOver={e => e.currentTarget.style.background = '#92400e'} onMouseOut={e => e.currentTarget.style.background = '#b45309'}>
                            {editingId ? '💾 Запази' : '✨ Създай'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#d1d5db'} onMouseOut={e => e.currentTarget.style.background = '#e5e7eb'}>
                                Отмени
                            </button>
                        )}
                    </div>
                </div>
            </form>

            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '0.9rem' }}>
                            <th style={{ padding: '14px 16px' }}>Име (БГ / EN)</th>
                            <th style={{ padding: '14px 16px' }}>Slug</th>
                            <th style={{ padding: '14px 16px' }}>Ред</th>
                            <th style={{ padding: '14px 16px' }}>Рецепти</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizedCategories.map(cat => {
                            const isSub = cat.level > 0;
                            return (
                                <tr key={cat.id} style={{ borderBottom: '1px solid #f0f0f0', background: isSub ? '#fafaf9' : '#fff', transition: 'background 0.1s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = isSub ? '#fafaf9' : '#fff'}>
                                    <td style={{ padding: '14px 16px', paddingLeft: isSub ? '36px' : '16px' }}>
                                        {isSub ? '↳ 📁 ' : '📂 '}
                                        <span style={{ fontWeight: isSub ? '500' : 'bold', color: '#1f2937' }}>{cat.name}</span>
                                        <span style={{ color: '#6b7280', margin: '0 6px' }}>/</span>
                                        <span style={{ color: '#4b5563', fontStyle: 'italic' }}>{cat.nameEn || '—'}</span>
                                        {isSub && <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px', fontWeight: '500' }}>подкатегория</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.9rem' }}>{cat.slug}</td>
                                    <td style={{ padding: '14px 16px', color: '#374151' }}>{cat.sortOrder}</td>
                                    <td style={{ padding: '14px 16px', color: '#374151' }}>
                                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600' }}>
                                            {cat.recipeCount}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(cat)} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', marginRight: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#dbeafe'} onMouseOut={e => e.currentTarget.style.background = '#eff6ff'}>
                                            ✏️ Редактирай
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}>
                                            🗑️ Изтрий
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
