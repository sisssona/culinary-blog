import api from './axios';

export const subscribeToNewsletter = async (email) => {
    const response = await api.post('/newsletter/subscribe', { email });
    return response.data;
};
