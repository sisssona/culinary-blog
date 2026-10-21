import { Routes, Route } from 'react-router-dom';
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
import { useAuth } from '../../context/AuthContext';
import UnsubscribePage from '../../pages/UnsubscribePage';
import AdminNewsletterPage from '../../pages/AdminNewsletterPage';

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
                    <Route path="/about" element={<InfoPage kind="about" />} />
                    <Route path="/encyclopedia" element={<InfoPage kind="encyclopedia" />} />

                    <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/add-recipe" element={<AddRecipePage />} />
                        <Route path="/recipes/:id/edit" element={<EditRecipe />} />
                        <Route path="/profile" element={<MyRecipes />} />
                    </Route>

                    {/* ADMIN — само за администратори */}
                    <Route element={<ProtectedRoute role="Admin" />}>
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    </Route>
                    <Route path="/unsubscribe" element={<UnsubscribePage />} />

                    {/* ADMIN — само за администратори */}
                    <Route element={<ProtectedRoute role="Admin" />}>
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                        <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
                    </Route>

                </Routes>
            </main>

            <Footer />
        </div>
    );
}
