import api from './axios';

// В newsletterService.js
export const subscribeToNewsletter = async (email) => {
    const preferredLanguage = localStorage.getItem('appLanguage') || 'bg';

    const response = await api.post('/newsletter/subscribe', {
        email,
        preferredLanguage
    });

    return response.data;
};
