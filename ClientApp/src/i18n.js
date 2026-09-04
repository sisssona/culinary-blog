import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    bg: {
        translation: {
            "blog_title": "Вкусни Рецепти",
            "error_loading_recipes": "Грешка при зареждане на рецептите.",
            "btn_login": "Вход",
            "loading": "Зареждане на рецепти...",
            "no_recipes": "Няма намерени рецепти.",
            "error_server": "Възникна грешка при връзката със сървъра.",
            "alert_add_recipe": "Формата за нова рецепта ще бъде добавена скоро!",
            "alert_login": "Формата за вход ще бъде добавена скоро!",
            "btn_add_recipe": "+ Добави рецепта",
            "btn_my_recipes": "📖 Моите рецепти",
            "btn_logout": "Изход",
            "btn_delete": "🗑️ Изтрий",
            "btn_view_more": "Виж повече →",
            "category_main": "Основни",
            "confirm_delete": "Сигурни ли сте, че искате да изтриете тази рецепта?"
        }
    },
    en: {
        translation: {
            "blog_title": "Delicious Recipes",
            "error_loading_recipes": "Error loading recipes.",
            "btn_login": "Login",
            "loading": "Loading recipes...",
            "no_recipes": "No recipes found.",
            "error_server": "An error occurred while connecting to the server.",
            "alert_add_recipe": "The new recipe form will be added soon!",
            "alert_login": "The login form will be added soon!",
            "btn_add_recipe": "+ Add Recipe",
            "btn_my_recipes": "📖 My Recipes",
            "btn_logout": "Logout",
            "btn_delete": "🗑️ Delete",
            "btn_view_more": "View More →",
            "category_main": "Main Dishes",
            "confirm_delete": "Are you sure you want to delete this recipe?"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'bg',
        interpolation: { escapeValue: false }
    });

export default i18n;