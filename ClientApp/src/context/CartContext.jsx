import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'shopCart';

const readCart = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export function CartProvider({ children }) {
    const [items, setItems] = useState(readCart);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = (product, quantity = 1) => {
        setItems((current) => {
            const existing = current.find((item) => item.productId === product.id);
            const nextQuantity = (existing?.quantity || 0) + quantity;
            const limit = product.kind === 'digital' ? 1 : (product.stock == null ? nextQuantity : Math.min(nextQuantity, product.stock));
            const capped = product.kind === 'digital' ? 1 : limit;
            if (capped < 1) return current;
            const entry = {
                productId: product.id,
                name: product.name,
                nameEn: product.nameEn || '',
                price: product.price,
                imageUrl: product.imageUrl || '',
                kind: product.kind || 'stock',
                quantity: capped
            };
            if (!existing) return [...current, entry];
            return current.map((item) => (item.productId === product.id ? entry : item));
        });
    };

    const setQuantity = (productId, quantity) => {
        setItems((current) => current
            .map((item) => (item.productId === productId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0));
    };

    const removeItem = (productId) => {
        setItems((current) => current.filter((item) => item.productId !== productId));
    };

    const clear = () => setItems([]);

    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, setQuantity, removeItem, clear, count, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart трябва да се използва вътре в CartProvider');
    return context;
}
