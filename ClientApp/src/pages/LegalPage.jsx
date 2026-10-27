import { useTranslation } from 'react-i18next';

export default function LegalPage({ pageKey }) {
    const { t } = useTranslation();
    const sections = t(`${pageKey}.sections`, { returnObjects: true });
    const list = Array.isArray(sections) ? sections : [];

    return (
        <article className="legal-page">
            <h1>{t(`${pageKey}.title`)}</h1>
            <p className="encyclopedia-intro">{t(`${pageKey}.updated`)}</p>
            {list.map((section) => (
                <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    <p>{section.body}</p>
                </section>
            ))}
        </article>
    );
}
