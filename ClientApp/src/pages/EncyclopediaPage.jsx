import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getArticles, mediaUrl } from '../api/recipeService';
import { localized } from '../utils/localizedText';

export default function EncyclopediaPage() {
    const { t, i18n } = useTranslation();
    const [articles, setArticles] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let active = true;
        getArticles()
            .then((data) => {
                if (!active) return;
                setArticles(Array.isArray(data) ? data : []);
                setStatus('ready');
            })
            .catch(() => {
                if (active) setStatus('error');
            });
        return () => { active = false; };
    }, []);

    return (
        <section className="encyclopedia">
            <h1>{t('encyclopedia')}</h1>
            <p className="encyclopedia-intro">{t('encyclopedia_intro')}</p>
            {status === 'loading' && <p>{t('encyclopedia_loading')}</p>}
            {status === 'error' && <p>{t('encyclopedia_error')}</p>}
            {status === 'ready' && articles.length === 0 && <p>{t('encyclopedia_empty')}</p>}
            <div className="encyclopedia-list">
                {articles.map((article) => (
                    <Link key={article.id} to={`/encyclopedia/${article.slug}`} className="encyclopedia-card">
                        {article.imageUrl && <img className="encyclopedia-card-image" src={mediaUrl(article.imageUrl)} alt="" />}
                        <div className="encyclopedia-card-body">
                            <h2>{localized(i18n.language, article.title, article.titleEn)}</h2>
                            {(article.excerpt || article.excerptEn) && <p>{localized(i18n.language, article.excerpt, article.excerptEn)}</p>}
                            <span>
                                {article.authorName}
                                {article.createdAt ? ` · ${new Date(article.createdAt).toLocaleDateString(i18n.language)}` : ''}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
