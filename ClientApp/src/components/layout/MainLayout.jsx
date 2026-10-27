import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import SearchBar from './SearchBar';
import RecipeListPage from '../../pages/RecipeListPage';

import HomePage from '../../pages/HomePage';
import AddRecipePage from '../../pages/AddRecipePage';
import RecipeDetails from '../../pages/RecipeDetails';
import EditRecipe from '../../pages/EditRecipe';
import MyRecipes from '../../pages/MyRecipes';
import ConfirmEmailPage from '../../pages/ConfirmEmailPage';
import ResetPasswordPage from '../../pages/ResetPasswordPage';
import LoginModal from '../LoginModal';
import VerificationBanner from '../VerificationBanner';
import { ProtectedRoute } from '../ProtectedRoute';
import AdminCategoriesPage from '../../pages/AdminCategoriesPage';
import InfoPage from '../../pages/InfoPage';
import EncyclopediaPage from '../../pages/EncyclopediaPage';
import ArticlePage from '../../pages/ArticlePage';
import CookPage from '../../pages/CookPage';
import { useAuth } from '../../context/AuthContext';
import UnsubscribePage from '../../pages/UnsubscribePage';
import AdminNewsletterPage from '../../pages/AdminNewsletterPage';
import AdminModerationPage from '../../pages/AdminModerationPage';
import AdminArticlesPage from '../../pages/AdminArticlesPage';
import AdminUsersPage from '../../pages/AdminUsersPage';
import AdminAuditPage from '../../pages/AdminAuditPage';
import AccountPage from '../../pages/AccountPage';
import ShopPage from '../../pages/ShopPage';
import ProductPage from '../../pages/ProductPage';
import CartPage from '../../pages/CartPage';
import AdminProductsPage from '../../pages/AdminProductsPage';
import AdminOrdersPage from '../../pages/AdminOrdersPage';
import LegalPage from '../../pages/LegalPage';
import CookieNotice from '../CookieNotice';

import { useState } from 'react';

export default function MainLayout() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="layout-container">
            <Header onLoginOpen={() => setIsLoginOpen(true)} />

            <Navigation />

            <SearchBar />

            {user && user.emailConfirmed === false && (
                <VerificationBanner userEmail={user.email} />
            )}

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/recipes" element={<RecipeListPage />} />
                    <Route path="/recipes/:id" element={<RecipeDetails />} />
                    <Route path="/cooks/:id" element={<CookPage />} />
                    <Route path="/about" element={<InfoPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/shop/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/encyclopedia" element={<EncyclopediaPage />} />
                    <Route path="/encyclopedia/:slug" element={<ArticlePage />} />
                    <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
                    <Route path="/terms" element={<LegalPage pageKey="terms" />} />

                    <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/add-recipe" element={<AddRecipePage />} />
                        <Route path="/recipes/:id/edit" element={<EditRecipe />} />
                        <Route path="/my-recipes" element={<MyRecipes />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/profile" element={<Navigate to="/account" replace />} />
                    </Route>

                    {/* ADMIN — само за администратори */}
                    <Route element={<ProtectedRoute role="Admin" />}>
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    </Route>
                    <Route path="/unsubscribe" element={<UnsubscribePage />} />

                    {/* ADMIN — само за администратори */}
                    <Route element={<ProtectedRoute role="Admin" />}>
                        <Route path="/admin/moderation" element={<AdminModerationPage />} />
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                        <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
                        <Route path="/admin/articles" element={<AdminArticlesPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/audit" element={<AdminAuditPage />} />
                        <Route path="/admin/products" element={<AdminProductsPage />} />
                        <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    </Route>

                </Routes>
            </main>

            <Footer />
            <CookieNotice />
        </div>
    );
}
