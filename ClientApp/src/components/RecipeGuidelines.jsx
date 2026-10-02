import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTags } from '../api/recipeService';

export default function RecipeGuidelines() {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(true);
    const [tagsByGroup, setTagsByGroup] = useState({});

    useEffect(() => {
        getTags()
            .then((tags) => {
                const grouped = {};
                tags.forEach((tag) => {
                    const group = tag.group || 'other';
                    if (!grouped[group]) grouped[group] = [];
                    grouped[group].push(tag);
                });
                setTagsByGroup(grouped);
            })
            .catch(() => setTagsByGroup({}));
    }, []);

    return (
        <div className="recipe-guidelines" style={{ gridColumn: 'span 2', marginBottom: '10px' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', padding: 0, fontSize: '1rem', color: 'inherit'
                }}
            >
                {isOpen ? '▾' : '▸'} {t('guidelines.title')}
            </button>

            {isOpen && (
                <>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: 1.6 }}>
                        <li dangerouslySetInnerHTML={{ __html: t('guidelines.tip1') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('guidelines.tip2') }} />
                        <li>{t('guidelines.tip3')}</li>
                        <li>{t('guidelines.tip4')}</li>
                    </ul>

                    {Object.keys(tagsByGroup).length > 0 && (
                        <div className="tag-overview">
                            <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>{t('guidelines.availableTags')}</p>
                            {Object.entries(tagsByGroup).map(([group, tags]) => {
                                const groupLabel = t(`guidelines.groups.${group}`, { defaultValue: group });
                                return (
                                    <div key={group} style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                                            {groupLabel}:
                                        </span>{' '}
                                        <span style={{ fontSize: '13px' }}>
                                            {tags.map((tag) => {
                                                // Търсим превод по slug (напр. recipe.tagsMapping.byrzo), а ако няма - ползваме tag.name от базата
                                                const translatedName = t(`recipe.tagsMapping.${tag.slug}`, { defaultValue: tag.name });
                                                return `#${translatedName}`;
                                            }).join('  ')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}