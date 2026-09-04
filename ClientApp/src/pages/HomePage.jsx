import { useTranslation } from 'react-i18next';
import RecipeList from './RecipeList';

export default function HomePage() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'bg';

    return (
        <main style={{ padding: '1rem' }}>
            <RecipeList lang={currentLang} />
        </main>
    );
}