import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mediaUrl } from '../api/recipeService';
import { formatPrice, listProducts } from '../api/shopService';
import { localized } from '../utils/localizedText';
import { useCart } from '../context/CartContext';

export default function ShopPage() {
    const { t, i18n } = useTranslation();
    const { count } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        listProducts()
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setError(t('shop_error')))
            .finally(() => setLoading(false));
    }, [t]);

    return (
        <section className="home-section">
            <div className="shop-heading">
                <h1>{t('shop')}</h1>
                <Link to="/cart">{t('shop_cart')}{count > 0 ? ` (${count})` : ''}</Link>
            </div>
            {loading && <p>{t('loading')}</p>}
            {error && <p className="admin-articles-error">{error}</p>}
            {!loading && !error && products.length === 0 && <p>{t('shop_empty')}</p>}
            <div className="recipe-grid">
                {products.map((product) => (
                    <article key={product.id} className="recipe-card">
                        <Link to={`/shop/${product.id}`} className="recipe-image-wrapper">
                            {product.imageUrl
                                ? <img className="recipe-image" src={mediaUrl(product.imageUrl)} alt="" />
                                : <div className="recipe-image recipe-image-empty" aria-hidden="true">🍽</div>}
                        </Link>
                        <div className="recipe-content">
                            <h2 className="recipe-title">{localized(i18n.language, product.name, product.nameEn)}</h2>
                            <p className="shop-price">{product.kind === 'external' && Number(product.price) === 0 ? t('shop_open_link') : formatPrice(product.price)}</p>
                            {product.stock === 0 && product.kind === 'stock' && <p className="shop-stock">{t('shop_sold_out')}</p>}
                            <Link to={`/shop/${product.id}`} className="recipe-button">{t('shop_view')}</Link>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
