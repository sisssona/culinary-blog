import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createOrder, formatPrice, getShopSettings } from '../api/shopService';
import { localized } from '../utils/localizedText';
import { useCart } from '../context/CartContext';

const emptyForm = { customerName: '', phone: '', email: '', city: '', address: '', note: '', paymentMethod: 'bank' };

export default function CartPage() {
    const { t, i18n } = useTranslation();
    const { items, setQuantity, removeItem, clear, total } = useCart();
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);
    const [busy, setBusy] = useState(false);
    const [bank, setBank] = useState(null);

    const needsAddress = items.some((item) => (item.kind || 'stock') === 'stock' || item.kind === 'printful');
    const hasDigital = items.some((item) => item.kind === 'digital');
    const allowsCod = items.length > 0 && items.every((item) => (item.kind || 'stock') === 'stock');
    const hasPrintful = items.some((item) => item.kind === 'printful');

    useEffect(() => {
        getShopSettings().then(setBank).catch(() => setBank(null));
    }, []);

    useEffect(() => {
        if (!allowsCod && form.paymentMethod === 'cod') {
            setForm((current) => ({ ...current, paymentMethod: 'bank' }));
        }
    }, [allowsCod, form.paymentMethod]);

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            const result = await createOrder({
                ...form,
                address: needsAddress ? form.address : '',
                city: needsAddress ? form.city : '',
                items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
            });
            setOrder(result);
            clear();
            setForm(emptyForm);
        } catch (err) {
            setError(err.response?.data?.error || t('shop_order_error'));
        } finally {
            setBusy(false);
        }
    };

    if (order) {
        const details = order.bank || {};
        const hasBank = order.paymentMethod === 'bank' && (details.iban || details.accountName);
        return (
            <section className="home-section">
                <h1>{t('shop_thanks')}</h1>
                <p>{order.paymentMethod === 'bank'
                    ? t('shop_thanks_bank', { id: order.id, total: formatPrice(order.total) })
                    : order.hasDigital
                        ? t('shop_thanks_digital', { id: order.id })
                        : order.hasPrintful
                            ? t('shop_thanks_printful', { id: order.id })
                            : t('shop_thanks_body', { id: order.id })}</p>
                {order.paymentMethod === 'bank' && (
                    hasBank ? (
                        <div>
                            {details.accountName && <p>{t('shop_bank_account')}: {details.accountName}</p>}
                            {details.iban && <p>{t('shop_bank_iban')}: {details.iban}</p>}
                            {details.bankName && <p>{t('shop_bank_name')}: {details.bankName}</p>}
                            {details.paymentNote && <p>{details.paymentNote}</p>}
                        </div>
                    ) : <p>{t('shop_bank_missing')}</p>
                )}
                <Link to="/shop">{t('shop_back')}</Link>
            </section>
        );
    }

    return (
        <section className="home-section">
            <h1>{t('shop_cart')}</h1>
            {items.length === 0 ? (
                <p>{t('shop_cart_empty')} <Link to="/shop">{t('shop')}</Link></p>
            ) : (
                <>
                    <ul className="cart-list">
                        {items.map((item) => (
                            <li key={item.productId}>
                                <div>
                                    <strong>{localized(i18n.language, item.name, item.nameEn)}</strong>
                                    <span>{formatPrice(item.price)}</span>
                                </div>
                                {item.kind !== 'digital' && (
                                    <label>
                                        {t('shop_quantity')}
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={item.quantity}
                                            onChange={(event) => setQuantity(item.productId, Math.max(0, Number(event.target.value) || 0))}
                                        />
                                    </label>
                                )}
                                <button type="button" className="btn red" onClick={() => removeItem(item.productId)}>{t('shop_remove')}</button>
                            </li>
                        ))}
                    </ul>
                    <p className="shop-price">{t('shop_total')}: {formatPrice(total)}</p>
                    <form className="shop-form" onSubmit={submit}>
                        <h2>{needsAddress ? t('shop_checkout') : t('shop_name')}</h2>
                        <label>{t('shop_name')}<input required value={form.customerName} onChange={set('customerName')} /></label>
                        <label>{t('shop_phone')}<input required value={form.phone} onChange={set('phone')} /></label>
                        <label>{t('shop_email')}<input type="email" required={hasDigital} value={form.email} onChange={set('email')} /></label>
                        {needsAddress && (
                            <>
                                <label>{t('shop_city')}<input value={form.city} onChange={set('city')} /></label>
                                <label>{t('shop_address')}<input required value={form.address} onChange={set('address')} /></label>
                            </>
                        )}
                        <label>{t('shop_note')}<textarea value={form.note} onChange={set('note')} rows="3" /></label>
                        <fieldset>
                            <legend>{t('shop_payment')}</legend>
                            {allowsCod && <label><input type="radio" name="payment" value="cod" checked={form.paymentMethod === 'cod'} onChange={set('paymentMethod')} /> {t('shop_pay_cod')}</label>}
                            <label><input type="radio" name="payment" value="bank" checked={form.paymentMethod === 'bank'} onChange={set('paymentMethod')} /> {t('shop_pay_bank')}</label>
                            <label><input type="radio" name="payment" value="contact" checked={form.paymentMethod === 'contact'} onChange={set('paymentMethod')} /> {t('shop_pay_contact')}</label>
                        </fieldset>
                        {form.paymentMethod === 'bank' && bank?.iban && (
                            <p className="shop-pay-note">{bank.accountName} · {bank.iban}{bank.bankName ? ` · ${bank.bankName}` : ''}</p>
                        )}
                        <p className="shop-pay-note">{t('shop_pay_note')}</p>
                        {error && <p className="admin-articles-error">{error}</p>}
                        <button type="submit" className="btn green" disabled={busy}>{busy ? t('shop_sending') : t('shop_send')}</button>
                    </form>
                </>
            )}
        </section>
    );
}
