import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mediaUrl } from '../api/recipeService';
import { createProduct, deleteProduct, formatPrice, listManagedProducts, updateProduct } from '../api/shopService';

const emptyForm = { name: '', description: '', price: '', stock: '', kind: 'stock', externalUrl: '', isPublished: true };

export default function AdminProductsPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [digitalFile, setDigitalFile] = useState(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);

    const load = () => {
        listManagedProducts()
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setError(t('shop_error')));
    };

    useEffect(() => { load(); }, []);

    const reset = () => {
        setForm(emptyForm);
        setEditing(null);
        setImageFile(null);
        setRemoveImage(false);
        setDigitalFile(null);
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');
        setSaving(true);
        const payload = { ...form, image: imageFile, removeImage, file: digitalFile };
        try {
            if (editing) {
                await updateProduct(editing.id, payload);
                setStatus(t('shop_saved'));
            } else {
                await createProduct(payload);
                setStatus(t('shop_saved'));
            }
            reset();
            load();
        } catch (err) {
            setError(err.response?.data?.error || t('shop_error'));
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (product) => {
        if (!window.confirm(t('shop_delete_confirm'))) return;
        await deleteProduct(product.id);
        if (editing?.id === product.id) reset();
        load();
    };

    return (
        <div className="admin-articles">
            <h1>{t('shop_admin_products')}</h1>
            {status && <p className="admin-articles-ok">{status}</p>}
            {error && <p className="admin-articles-error">{error}</p>}
            <form className="admin-articles-form" onSubmit={onSubmit}>
                <label>{t('shop_name')}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label>{t('shop_description')}<textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
                <label>{t('shop_price')}<input required={form.kind !== 'external'} inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>
                    {t('shop_kind')}
                    <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                        <option value="stock">{t('shop_kind_stock')}</option>
                        <option value="printful">{t('shop_kind_printful')}</option>
                        <option value="digital">{t('shop_kind_digital')}</option>
                        <option value="external">{t('shop_kind_external')}</option>
                    </select>
                </label>
                {form.kind === 'stock' && (
                    <label>{t('shop_stock')}<input inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder={t('shop_stock_hint')} /></label>
                )}
                {form.kind === 'external' && (
                    <label>{t('shop_external_url')}<input required type="url" value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} /></label>
                )}
                {form.kind === 'digital' && (
                    <label className="shop-file">
                        {t('shop_file')}
                        <span className="shop-file-row">
                            <span className="shop-file-button">{t('shop_choose_file')}</span>
                            {digitalFile && <span className="shop-file-name">{digitalFile.name}</span>}
                            {!digitalFile && editing?.fileName && <span className="shop-file-name">{editing.fileName}</span>}
                        </span>
                        <input type="file" accept=".pdf,.epub,.zip,application/pdf" onChange={(e) => setDigitalFile(e.target.files?.[0] || null)} />
                        <small>{t('shop_file_hint')}</small>
                    </label>
                )}
                <label className="admin-audit-toggle">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                    {t('shop_published')}
                </label>
                <label className="shop-file">
                    {t('shop_image')}
                    <span className="shop-file-row">
                        <span className="shop-file-button">{t('shop_choose_image')}</span>
                        {imageFile && <span className="shop-file-name">{imageFile.name}</span>}
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }} />
                </label>
                {editing?.imageUrl && !removeImage && !imageFile && (
                    <div className="admin-articles-preview"><img src={mediaUrl(editing.imageUrl)} alt="" /></div>
                )}
                {editing?.imageUrl && (
                    <button type="button" className="btn" onClick={() => { setRemoveImage(true); setImageFile(null); }}>{t('shop_remove_image')}</button>
                )}
                <div className="admin-articles-actions">
                    <button type="submit" className="btn green" disabled={saving}>{saving ? t('saving') : t('shop_save')}</button>
                    {editing && <button type="button" className="btn" onClick={reset}>{t('common.cancel')}</button>}
                </div>
            </form>
            <ul className="admin-articles-list">
                {products.map((product) => (
                    <li key={product.id}>
                        <div>
                            <strong>{product.name}</strong>
                            <span>{formatPrice(product.price)} · {t(`shop_kind_${product.kind || 'stock'}`)} · {product.isPublished ? t('shop_published') : t('shop_hidden')}{product.stock == null ? '' : ` · ${product.stock}`}</span>
                        </div>
                        <div className="admin-articles-actions">
                            <button type="button" className="btn" onClick={() => { setEditing(product); setForm({ name: product.name, description: product.description || '', price: String(product.price), stock: product.stock ?? '', kind: product.kind || 'stock', externalUrl: product.externalUrl || '', isPublished: product.isPublished }); setImageFile(null); setRemoveImage(false); setDigitalFile(null); }}>{t('shop_edit')}</button>
                            <button type="button" className="btn red" onClick={() => onDelete(product)}>{t('shop_delete')}</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
