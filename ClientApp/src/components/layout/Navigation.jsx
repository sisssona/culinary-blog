import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import { getCategories } from '../../api/recipeService';

const CLOSE_DELAY = 150; // ms — small buffer so moving the mouse between items doesn't flicker

export default function Navigation() {
    const { i18n } = useTranslation();
    const lang = i18n.language || 'bg';
    const { isAdmin } = useAuth();
    const location = useLocation();

    const [categories, setCategories] = useState([]);
    const [openId, setOpenId] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const closeTimerRef = useRef(null);

    useEffect(() => {
        getCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : data.items ?? []))
            .catch(() => setCategories([]));
    }, []);

    // Close any open dropdown (and the mobile panel) whenever the route changes
    // (e.g. clicking the logo/"Начало", or picking a category/subcategory).
    useEffect(() => {
        setOpenId(null);
        setMobileOpen(false);
    }, [location.pathname, location.search]);

    const scheduleClose = () => {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => setOpenId(null), CLOSE_DELAY);
    };

    const cancelClose = (id) => {
        clearTimeout(closeTimerRef.current);
        setOpenId(id);
    };

    const label = (cat) => (lang === 'bg' ? cat.name : (cat.nameEn || cat.name));

    return (
        <div className="nav-container">
            <button
                type="button"
                className="nav-hamburger"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-expanded={mobileOpen}
            >
                <span>☰</span> Категории
            </button>

            <nav className={`nav-categories${mobileOpen ? ' open' : ''}`}>
                <Link to="/recipes">Всички рецепти</Link>

                {categories.map((cat) => {
                    const hasChildren = cat.subCategories && cat.subCategories.length > 0;
                    const isOpen = openId === cat.id;

                    return (
                        <div
                            key={cat.id}
                            className="nav-category-item"
                            onMouseEnter={() => hasChildren && cancelClose(cat.id)}
                            onMouseLeave={() => hasChildren && scheduleClose()}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="nav-category-toggle"
                                    onClick={() => setOpenId(isOpen ? null : cat.id)}
                                    aria-expanded={isOpen}
                                >
                                    {label(cat)} <span className="nav-caret">▾</span>
                                </button>
                            ) : (
                                <Link to={`/recipes?category=${cat.slug}`}>{label(cat)}</Link>
                            )}

                            {hasChildren && isOpen && (
                                <div
                                    className="nav-dropdown"
                                    onMouseEnter={() => cancelClose(cat.id)}
                                    onMouseLeave={scheduleClose}
                                >
                                    <Link
                                        to={`/recipes?category=${cat.slug}`}
                                        onClick={() => setOpenId(null)}
                                    >
                                        Всички от {label(cat)}
                                    </Link>
                                    {cat.subCategories.map((sub) => (
                                        <Link
                                            key={sub.id}
                                            to={`/recipes?category=${sub.slug}`}
                                            onClick={() => setOpenId(null)}
                                        >
                                            {label(sub)}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {isAdmin && (
                    <Link to="/admin/categories" className="admin-link">Админ</Link>
                )}
            </nav>
        </div>
    );
}
