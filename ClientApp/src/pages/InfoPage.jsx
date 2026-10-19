import { useTranslation } from 'react-i18next';

export default function InfoPage({ kind }) {
    const { t } = useTranslation();
    const isAbout = kind === 'about';

    return (
        <article className="recipe-details">
            <h1>{isAbout ? t('about') : t('encyclopedia')}</h1>
            <p className="recipe-text">
                {isAbout
                    ? (t('about_body') || 'Вкусни Рецепти е място за домашни рецепти, категории и готвачи. Съдържанието расте с всяка нова публикация.')
                    : (t('encyclopedia_body') || 'Кулинарната енциклопедия — съвети, техники и статии — ще бъде добавена тук. Засега разгледайте рецептите.')}
            </p>
        </article>
    );
}
