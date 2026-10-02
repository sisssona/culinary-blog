import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listRecipes } from '../../api/recipeService';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'bg';

    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            listRecipes({ q: query.trim(), lang, pageSize: 6 })
                .then((data) => {
                    const items = data?.items ?? data ?? [];
                    setSuggestions(items);
                    setIsOpen(true);
                })
                .catch(() => setSuggestions([]));
        }, 250);

        return () => clearTimeout(debounceRef.current);
    }, [query, lang]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim() !== '') {
            setIsOpen(false);
            navigate(`/recipes?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="search-bar-wrapper" ref={wrapperRef}>
            <form className="search-bar" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    className="form-input"
                />
                <button type="submit" className="btn green">🔍</button>
            </form>

            {isOpen && suggestions.length > 0 && (
                <div className="search-suggestions">
                    {suggestions.map((recipe) => (
                        <Link
                            key={recipe.id}
                            to={`/recipes/${recipe.id}`}
                            className="search-suggestion-item"
                            onClick={() => setIsOpen(false)}
                        >
                            {recipe.thumbnailUrl || recipe.imageUrl ? (
                                <img
                                    src={recipe.thumbnailUrl || recipe.imageUrl}
                                    alt={recipe.title}
                                    className="search-suggestion-image"
                                />
                            ) : (
                                <div className="search-suggestion-image search-suggestion-placeholder" />
                            )}
                            <div>
                                <div className="search-suggestion-title">{recipe.title}</div>
                                <div className="search-suggestion-category">{recipe.category}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
