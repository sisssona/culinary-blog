export function localized(lang, original, english) {
    if (typeof lang === 'string' && lang.toLowerCase().startsWith('en') && english) return english;
    return original || '';
}
