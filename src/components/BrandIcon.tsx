import "./BrandIcon.css";

// Two arrows (top: right, bottom: left). On hover they slide past each other and swap.
export default function BrandIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-icon ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="brand-arrow brand-arrow-top" d="M7 7h10m0 0-3-3m3 3-3 3" />
          <path className="brand-arrow brand-arrow-bottom" d="M17 17H7m0 0 3 3m-3-3 3-3" />
        </g>
      </svg>
    </span>
  );
}
