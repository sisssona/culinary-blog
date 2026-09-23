import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import SearchBar from './SearchBar';

import HomePage from '../../pages/HomePage';
import AddRecipePage from '../../pages/AddRecipePage';
import RecipeDetails from '../../pages/RecipeDetails';
import EditRecipe from '../../pages/EditRecipe';
import MyRecipes from '../../pages/MyRecipes';
import LoginModal from '../LoginModal';
import { ProtectedRoute } from '../ProtectedRoute';
import AdminCategoriesPage from '../../pages/AdminCategoriesPage';


import { useState } from 'react';

export default function MainLayout() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="layout-container">
            <Header onLoginOpen={() => setIsLoginOpen(true)} />

            <Navigation />

            <SearchBar />

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/recipes" element={<HomePage />} />
                    <Route path="/recipes/:id" element={<RecipeDetails />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/add-recipe" element={<AddRecipePage />} />
                        <Route path="/recipes/:id/edit" element={<EditRecipe />} />
                        <Route path="/profile" element={<MyRecipes />} />
                    </Route>

                    {/* ADMIN — само за администратори */}
                    <Route element={<ProtectedRoute role="Admin" />}>
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    </Route>
                </Routes>

            </main>

            <Footer />
        </div>
    );
}
