import verifiedBadgeImg from "../assets/verified-badge.png";
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
      <img
        className="verified-badge-icon"
        src={verifiedBadgeImg}
        alt={compact ? "Verified" : ""}
        draggable={false}
      />
    </span>
  );
}
