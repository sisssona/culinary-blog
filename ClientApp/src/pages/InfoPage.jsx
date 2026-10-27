import { useTranslation } from 'react-i18next';

export default function InfoPage() {
    const { t } = useTranslation();

    return (
        <article className="recipe-details">
            <h1>{t('about')}</h1>
            <p className="recipe-text">
                {t('about_body', 'Tava е място за рецепти, категории и готвачи. Съдържанието расте с всяка нова публикация.')}
            </p>
        </article>
    );
}
