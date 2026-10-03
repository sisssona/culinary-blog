import { useTranslation } from 'react-i18next';

const UNIT_VALUES = ['бр.', 'г', 'кг', 'мл', 'л', 'ч.л.', 'с.л.', 'ч.ч.', 'щипка', 'връзка'];

let rowIdCounter = 0;
const newRow = () => ({ id: ++rowIdCounter, name: '', amount: '', unit: 'бр.' });

export default function IngredientInput({ rows, onChange }) {
    const { t } = useTranslation();

    const updateRow = (id, field, value) => {
        onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const addRow = () => {
        onChange([...rows, newRow()]);
    };

    const removeRow = (id) => {
        if (rows.length <= 1) return; // always keep at least one row
        onChange(rows.filter((r) => r.id !== id));
    };

    return (
        <div className="form-group">
            <label>{t('recipe.fields.ingredients')}</label>

            <div className="ingredient-rows">
                {rows.map((row) => (
                    <div key={row.id} className="ingredient-row">
                        <input
                            type="text"
                            className="form-input ingredient-name"
                            placeholder={t('recipe.fields.ingredientNamePlaceholder')}
                            value={row.name}
                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        />
                        <input
                            type="text"
                            inputMode="decimal"
                            className="form-input ingredient-amount"
                            placeholder={t('recipe.fields.ingredientAmountPlaceholder')}
                            value={row.amount}
                            onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                        />
                        <select
                            className="form-input ingredient-unit"
                            value={row.unit}
                            onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                        >
                            {UNIT_VALUES.map((u) => (
                                <option key={u} value={u}>{t(`recipe.units.${u}`, u)}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="ingredient-remove"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length <= 1}
                            aria-label={t('recipe.ingredientsActions.removeRow')}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <button type="button" className="ingredient-add" onClick={addRow}>
                {t('recipe.ingredientsActions.addRow')}
            </button>
        </div>
    );
}

export { newRow };
