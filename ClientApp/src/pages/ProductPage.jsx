import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mediaUrl } from '../api/recipeService';
import { formatPrice, getProduct } from '../api/shopService';
import { localized } from '../utils/localizedText';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState('');
    const [added, setAdded] = useState(false);

    useEffect(() => {
        setAdded(false);
        getProduct(id)
            .then(setProduct)
            .catch(() => setError(t('shop_missing')));
    }, [id, t]);

    if (error) {
        return (
            <section className="home-section">
                <p>{error}</p>
                <Link to="/shop">{t('shop_back')}</Link>
            </section>
        );
    }
    if (!product) return <p className="loading">{t('loading')}</p>;

    const soldOut = product.kind !== 'external' && product.kind !== 'digital' && product.kind !== 'printful' && product.stock === 0;
    const max = product.kind === 'digital' ? 1 : (product.stock == null ? 20 : Math.min(20, product.stock));

    const add = () => {
        addItem(product, quantity);
        setAdded(true);
    };

    return (
        <article className="recipe-details">
            <p><Link to="/shop">{t('shop_back')}</Link></p>
            {product.imageUrl
                ? <img className="shop-photo" src={mediaUrl(product.imageUrl)} alt="" />
                : <div className="recipe-image-empty shop-photo" aria-hidden="true">🍽</div>}
            <h1>{localized(i18n.language, product.name, product.nameEn)}</h1>
            <p className="shop-price">{formatPrice(product.price)}</p>
            {(product.description || product.descriptionEn) && (
                <p className="shop-description">{localized(i18n.language, product.description, product.descriptionEn)}</p>
            )}
            {product.kind === 'printful' && <p className="shop-stock">{t('shop_printful_note')}</p>}
            {product.kind === 'digital' && <p className="shop-stock">{t('shop_digital_note')}</p>}
            {product.kind === 'external'
                ? <p><a className="btn green" href={product.externalUrl} target="_blank" rel="noreferrer">{t('shop_open_link')}</a></p>
                : soldOut
                ? <p className="shop-stock">{t('shop_sold_out')}</p>
                : (
                    <div className="shop-buy">
                        {product.kind !== 'digital' && (
                            <label>
                                {t('shop_quantity')}
                                <input
                                    type="number"
                                    min="1"
                                    max={max}
                                    value={quantity}
                                    onChange={(event) => setQuantity(Math.max(1, Math.min(max, Number(event.target.value) || 1)))}
                                />
                            </label>
                        )}
                        <button type="button" className="btn green" onClick={add}>{t('shop_add')}</button>
                        {added && (
                            <button type="button" className="btn" onClick={() => navigate('/cart')}>{t('shop_go_cart')}</button>
                        )}
                    </div>
                )}
        </article>
    );
}
