export default function LogoMark({ className = "logo-mark" }) {
    return (
        <svg
            className={className}
            viewBox="0 0 64 36"
            aria-hidden="true"
            focusable="false"
        >
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M3 6h58c2.2 0 3.6 2.2 2.8 4.2L56.2 30.2A6 6 0 0 1 50.4 34H13.6a6 6 0 0 1-5.8-3.8L.2 10.2C-.6 8.2.8 6 3 6zm13 7h32l-3.2 14.2a2.5 2.5 0 0 1-2.4 1.8H21.6a2.5 2.5 0 0 1-2.4-1.8L16 13z"
            />
        </svg>
    );
}
