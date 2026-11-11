import "./VerifiedBadge.css";

interface VerifiedBadgeProps {
  verified?: boolean;
  /** Icon-only for tight pills */
  compact?: boolean;
}

export default function VerifiedBadge({
  verified = false,
  compact = false,
}: VerifiedBadgeProps) {
  if (!verified) return null;

  return (
    <span
      className={
        compact
          ? "verified-badge verified-badge--compact"
          : "verified-badge"
      }
      title="Verified skill"
    >
      {!compact ? (
        <span className="verified-badge-label">Verified</span>
      ) : null}
      <svg
        className="verified-badge-icon"
        viewBox="0 0 24 24"
        role={compact ? "img" : undefined}
        aria-label={compact ? "Verified" : undefined}
        aria-hidden={compact ? undefined : true}
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M7.5 12.4l3 3 6-6.4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
