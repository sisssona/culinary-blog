import api from './axios';

export const formatPrice = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    return `${number.toFixed(2).replace('.', ',')} €`;
};

export const listProducts = () => api.get('/products').then((r) => r.data);
export const listManagedProducts = () => api.get('/products/manage').then((r) => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);

const productForm = (payload) => {
    const form = new FormData();
    form.append('Name', payload.name);
    form.append('Description', payload.description || '');
    form.append('Price', String(payload.price ?? '').replace(',', '.'));
    form.append('Stock', payload.stock ?? '');
    form.append('Kind', payload.kind || 'stock');
    form.append('ExternalUrl', payload.externalUrl || '');
    form.append('IsPublished', payload.isPublished ? 'true' : 'false');
    if (payload.image) form.append('Image', payload.image);
    if (payload.removeImage) form.append('RemoveImage', 'true');
    if (payload.file) form.append('File', payload.file);
    if (payload.removeFile) form.append('RemoveFile', 'true');
    return form;
};

export const createProduct = (payload) => api.post('/products', productForm(payload)).then((r) => r.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, productForm(payload)).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const createOrder = (payload) => api.post('/orders', payload).then((r) => r.data);
export const listOrders = () => api.get('/orders').then((r) => r.data);
export const setOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status }).then((r) => r.data);
export const getShopSettings = () => api.get('/shop/settings').then((r) => r.data);
export const saveShopSettings = (payload) => api.put('/shop/settings', payload).then((r) => r.data);
