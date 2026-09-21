import api from './axios';

export const mediaUrl = (path) => {
    if (!path) return '/no-image.jpg';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? path : `/${path}`;
};

export const listRecipes = (params) => api.get('/recipes', { params }).then((r) => r.data);
export const featuredRecipes = (lang) => api.get('/recipes/featured', { params: { lang } }).then((r) => r.data);
export const popularRecipes = (lang) => api.get('/recipes/popular', { params: { lang } }).then((r) => r.data);
export const getRecipe = (idOrSlug, lang) => api.get(`/recipes/${idOrSlug}`, { params: { lang } }).then((r) => r.data);
export const similarRecipes = (idOrSlug, lang) => api.get(`/recipes/${idOrSlug}/similar`, { params: { lang } }).then((r) => r.data);
export const getMyRecipes = (lang) => api.get('/recipes/my-recipes', { params: { lang } }).then((r) => r.data);
export const getFavorites = (lang) => api.get('/recipes/favorites', { params: { lang } }).then((r) => r.data);
export const getPending = (lang) => api.get('/recipes/pending', { params: { lang } }).then((r) => r.data);
export const approveRecipe = (id) => api.post(`/recipes/${id}/approve`);
export const rejectRecipe = (id) => api.post(`/recipes/${id}/reject`);
export const deleteRecipe = (id) => api.delete(`/recipes/${id}`);
export const getCategories = () => api.get('/categories').then((r) => r.data);
export const getCook = (id, lang) => api.get(`/users/${id}`, { params: { lang } }).then((r) => r.data);
export const getArticles = () => api.get('/articles').then((r) => r.data);
export const getArticle = (slug) => api.get(`/articles/${slug}`).then((r) => r.data);
export const createArticle = (payload) => api.post('/articles', payload).then((r) => r.data);
export const getComments = (recipeId) => api.get(`/recipes/${recipeId}/comments`).then((r) => r.data);
export const addComment = (recipeId, content) => api.post(`/recipes/${recipeId}/comments`, { content }).then((r) => r.data);
export const toggleLike = (recipeId) => api.post(`/recipes/${recipeId}/like`).then((r) => r.data);
export const toggleFavorite = (recipeId) => api.post(`/recipes/${recipeId}/favorite`).then((r) => r.data);
export const rateRecipe = (recipeId, value) => api.post(`/recipes/${recipeId}/rate`, { value }).then((r) => r.data);
