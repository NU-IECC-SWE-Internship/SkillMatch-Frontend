import "./BrandIcon.css";

export default function BrandIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-icon ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path
          d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3 3m-3-3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
