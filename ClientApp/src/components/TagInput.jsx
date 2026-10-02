import { useEffect, useState } from 'react';
import { getTags } from '../api/recipeService';

const MIN_TAGS = 3;
const MAX_TAGS = 6;

const GROUP_LABELS = {
    time: 'Време и бързина',
    occasion: 'Повод',
    diet: 'Диета и здраве',
    difficulty: 'Трудност и бюджет',
    method: 'Начин на приготвяне'
};

const GROUP_ORDER = ['time', 'occasion', 'diet', 'difficulty', 'method'];

export default function TagInput({ selectedTags, onChange }) {
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

    const isSelected = (tagId) => selectedTags.some((t) => t.id === tagId);
    const atLimit = selectedTags.length >= MAX_TAGS;
    const belowMin = selectedTags.length < MIN_TAGS;

    const toggleTag = (tag) => {
        if (isSelected(tag.id)) {
            onChange(selectedTags.filter((t) => t.id !== tag.id));
        } else {
            if (atLimit) return;
            onChange([...selectedTags, tag]);
        }
    };

    const groupKeys = [
        ...GROUP_ORDER.filter((g) => tagsByGroup[g]),
        ...Object.keys(tagsByGroup).filter((g) => !GROUP_ORDER.includes(g))
    ];

    return (
        <div className="form-group tag-input">
            <label>
                Тагове — кликнете, за да изберете между {MIN_TAGS} и {MAX_TAGS}
                {' '}(избрани: {selectedTags.length}):
            </label>

            <p className="tag-explainer">
                Таговете помагат на читателите да намерят рецептата по повод, диета, скорост на
                приготвяне и т.н. — независимо в коя категория е. Категорията вече показва <em>какво</em> е
                ястието (салата, основно, десерт...), затова тук няма нужда да повтаряте това.
            </p>

            {groupKeys.map((group) => (
                <div key={group} className="tag-group">
                    <p className="tag-group-label">{GROUP_LABELS[group] || group}</p>
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
                                    #{tag.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <p className={`tag-hint ${belowMin ? 'tag-hint-warning' : ''}`}>
                {atLimit
                    ? `Достигнахте максимума от ${MAX_TAGS} тага.`
                    : belowMin
                        ? `Изберете поне още ${MIN_TAGS - selectedTags.length} таг(а).`
                        : 'Може да изберете още тагове или да продължите.'}
            </p>
        </div>
    );
}
