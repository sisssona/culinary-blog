import api from './axios';

// 1. Вземане на всички лични рецепти на потребителя
export const getMyRecipes = async () => {
    const response = await api.get('/recipes/my-recipes');
    return response.data;
};

// 2. Вземане на всички публични рецепти (със съдействие за превод)
export const getAllRecipes = async (lang = 'bg') => {
    const response = await api.get(`/recipes?lang=${lang}`);
    return response.data;
};

// 3. Създаване на нова рецепта
export const createRecipe = async (formData) => {
    const response = await api.post('/recipes', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};