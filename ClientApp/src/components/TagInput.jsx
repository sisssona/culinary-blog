import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTags } from '../api/recipeService';

const MIN_TAGS = 3;
const MAX_TAGS = 6;
const GROUP_ORDER = ['time', 'occasion', 'diet', 'difficulty', 'method'];

export default function TagInput({ selectedTags, onChange }) {
    const { t } = useTranslation();
    const [tagsByGroup, setTagsByGroup] = useState({});
    const [openGroups, setOpenGroups] = useState({});
    const [panelOpen, setPanelOpen] = useState(true);

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

    const tagLabel = (tag) => t(`recipe.tagsMapping.${tag.slug}`, tag.name);
    const groupLabel = (group) => t(`guidelines.groups.${group}`, group);

    const isSelected = (tagId) => selectedTags.some((tg) => tg.id === tagId);
    const atLimit = selectedTags.length >= MAX_TAGS;
    const belowMin = selectedTags.length < MIN_TAGS;

    const toggleTag = (tag) => {
        if (isSelected(tag.id)) {
            onChange(selectedTags.filter((tg) => tg.id !== tag.id));
        } else {
            if (atLimit) return;
            onChange([...selectedTags, tag]);
        }
    };

    const toggleGroup = (group) => {
        setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
    };

    const groupKeys = [
        ...GROUP_ORDER.filter((g) => tagsByGroup[g]),
        ...Object.keys(tagsByGroup).filter((g) => !GROUP_ORDER.includes(g))
    ];

    return (
        <div className="form-group tag-input">
            <div className="tag-panel-header">
                <label>
                    {t('recipe.tags.label', { min: MIN_TAGS, max: MAX_TAGS })}
                    {' '}({t('recipe.tags.selectedCount', { count: selectedTags.length })})
                </label>
                <button
                    type="button"
                    className="tag-panel-toggle"
                    onClick={() => setPanelOpen((p) => !p)}
                >
                    {panelOpen ? t('recipe.tags.hideAll') : t('recipe.tags.showAll')}
                </button>
            </div>

            {selectedTags.length > 0 && (
                <div className="tag-chips-selected">
                    {selectedTags.map((tag) => (
                        <span key={tag.id} className="tag-chip tag-chip-removable">
                            #{tagLabel(tag)}
                            <button
                                type="button"
                                onClick={() => toggleTag(tag)}
                                aria-label={t('recipe.tags.removeAria', { name: tagLabel(tag) })}
                            >
                                ✕
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {panelOpen && (
                <>
                    <p className="tag-explainer">{t('recipe.tags.explainer')}</p>

                    {groupKeys.map((group) => {
                        const isOpen = !!openGroups[group];
                        return (
                            <div key={group} className="tag-group">
                                <button
                                    type="button"
                                    className="tag-group-toggle"
                                    onClick={() => toggleGroup(group)}
                                    aria-expanded={isOpen}
                                >
                                    {isOpen ? '▾' : '▸'} {groupLabel(group)}
                                </button>

                                {isOpen && (
                                    <div className="tag-picker-list">
                                        {tagsByGroup[group].map((tag) => {
                                            const selected = isSelected(tag.id);
                                            const disabled = !selected && atLimit;
                                            return (
                                                <button
                                                    type="button"
                                                    key={tag.id}
                                                    onClick={() => toggleTag(tag)}
                                                    disabled={disabled}
                                                    className={`tag-pick-chip${selected ? ' tag-pick-chip-selected' : ''}`}
                                                >
                                                    #{tagLabel(tag)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}

            <p className={`tag-hint ${belowMin ? 'tag-hint-warning' : ''}`}>
                {atLimit
                    ? t('recipe.tags.maxReached', { max: MAX_TAGS })
                    : belowMin
                        ? t('recipe.tags.needMore', { count: MIN_TAGS - selectedTags.length })
                        : t('recipe.tags.canContinue')}
            </p>
        </div>
    );
}
