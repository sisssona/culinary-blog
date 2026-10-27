import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice, getShopSettings, listOrders, saveShopSettings, setOrderStatus } from '../api/shopService';

const statuses = ['awaiting_payment', 'new', 'confirmed', 'sent', 'done', 'cancelled'];

export default function AdminOrdersPage() {
    const { t, i18n } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bank, setBank] = useState({ accountName: '', iban: '', bankName: '', paymentNote: '' });
    const [bankStatus, setBankStatus] = useState('');

    const load = () => {
        listOrders()
            .then((data) => setOrders(Array.isArray(data) ? data : []))
            .catch(() => setError(t('shop_error')))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        getShopSettings().then((data) => setBank({
            accountName: data.accountName || '',
            iban: data.iban || '',
            bankName: data.bankName || '',
            paymentNote: data.paymentNote || ''
        })).catch(() => {});
    }, []);

    const saveBank = async (event) => {
        event.preventDefault();
        setError('');
        setBankStatus('');
        try {
            const saved = await saveShopSettings(bank);
            setBank({
                accountName: saved.accountName || '',
                iban: saved.iban || '',
                bankName: saved.bankName || '',
                paymentNote: saved.paymentNote || ''
            });
            setBankStatus(t('shop_bank_saved'));
        } catch (err) {
            setError(err.response?.data?.error || t('shop_error'));
        }
    };

    const changeStatus = async (order, status) => {
        setError('');
        try {
            await setOrderStatus(order.id, status);
            load();
        } catch (err) {
            setError(err.response?.data?.error || t('shop_error'));
        }
    };

    return (
        <div className="admin-articles">
            <h1>{t('shop_admin_orders')}</h1>
            <form className="admin-articles-form" onSubmit={saveBank}>
                <h2>{t('shop_bank_title')}</h2>
                <label>{t('shop_bank_account')}<input value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} /></label>
                <label>{t('shop_bank_iban')}<input value={bank.iban} onChange={(e) => setBank({ ...bank, iban: e.target.value })} /></label>
                <label>{t('shop_bank_name')}<input value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} /></label>
                <label>{t('shop_bank_note')}<textarea rows="2" value={bank.paymentNote} onChange={(e) => setBank({ ...bank, paymentNote: e.target.value })} /></label>
                <button type="submit" className="btn green">{t('shop_bank_save')}</button>
                {bankStatus && <p className="admin-articles-ok">{bankStatus}</p>}
            </form>
            {error && <p className="admin-articles-error">{error}</p>}
            {!loading && orders.length === 0 && <p>{t('shop_no_orders')}</p>}
            <ul className="admin-articles-list">
                {orders.map((order) => (
                    <li key={order.id}>
                        <div>
                            <strong>#{order.id} · {order.customerName}</strong>
                            <span>{new Date(order.createdAt).toLocaleString(i18n.language)}</span>
                            <span>{order.phone}{order.email ? ` · ${order.email}` : ''}</span>
                            <span>{order.city ? `${order.city}, ` : ''}{order.address}</span>
                            <span>{t(`shop_pay_${order.paymentMethod}`)} · {formatPrice(order.total)}</span>
                            {order.note && <span>{order.note}</span>}
                            <ul>
                                {order.items.map((item, index) => (
                                    <li key={`${order.id}-${index}`}>{item.quantity} × {item.productName} ({formatPrice(item.unitPrice)}) · {t(`shop_kind_${item.kind || 'stock'}`)}</li>
                                ))}
                            </ul>
                            {order.items.some((item) => item.kind === 'printful') && <span>{t('shop_order_printful')}</span>}
                            {order.items.some((item) => item.kind === 'digital') && <span>{t('shop_order_digital')}</span>}
                            {order.downloadUrl && order.items.some((item) => item.kind === 'digital') && (
                                <span>{t('shop_copy_link')}: {order.downloadUrl}</span>
                            )}
                        </div>
                        <label>
                            {t('shop_status')}
                            <select value={order.status} onChange={(event) => changeStatus(order, event.target.value)}>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{t(`shop_status_${status}`)}</option>
                                ))}
                            </select>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
