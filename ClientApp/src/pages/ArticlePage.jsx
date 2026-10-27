import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getArticle, mediaUrl } from '../api/recipeService';
import { localized } from '../utils/localizedText';

export default function ArticlePage() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const [article, setArticle] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let active = true;
        setStatus('loading');
        setArticle(null);
        getArticle(slug)
            .then((data) => {
                if (!active) return;
                setArticle(data);
                setStatus('ready');
            })
            .catch(() => {
                if (active) setStatus('error');
            });
        return () => { active = false; };
    }, [slug]);

    if (status === 'loading') {
        return <p className="encyclopedia">{t('encyclopedia_loading')}</p>;
    }

    if (status === 'error' || !article) {
        return (
            <article className="recipe-details">
                <Link to="/encyclopedia" className="back-link">{t('encyclopedia_back')}</Link>
                <p>{t('encyclopedia_missing')}</p>
            </article>
        );
    }

    return (
        <article className="recipe-details">
            <Link to="/encyclopedia" className="back-link">{t('encyclopedia_back')}</Link>
            <h1>{localized(i18n.language, article.title, article.titleEn)}</h1>
            <p className="recipe-category">
                {article.authorName}
                {article.createdAt ? ` · ${new Date(article.createdAt).toLocaleDateString(i18n.language)}` : ''}
            </p>
            {article.imageUrl && (
                <img className="encyclopedia-hero" src={mediaUrl(article.imageUrl)} alt={localized(i18n.language, article.title, article.titleEn)} />
            )}
            {(article.excerpt || article.excerptEn) && <p className="encyclopedia-excerpt">{localized(i18n.language, article.excerpt, article.excerptEn)}</p>}
            <div className="recipe-text">{localized(i18n.language, article.body, article.bodyEn)}</div>
        </article>
    );
}
