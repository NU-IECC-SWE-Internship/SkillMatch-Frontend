interface UserRatingBadgeProps {
  ratingAverage?: number;
  ratingCount?: number;
  className?: string;
}

export default function UserRatingBadge({
  ratingAverage = 0,
  ratingCount = 0,
  className = "",
}: UserRatingBadgeProps) {
  const count = Number(ratingCount) || 0;
  const avg = Number(ratingAverage) || 0;

  return (
    <div className={`partner-rating-badge ${className}`.trim()}>
      {count > 0 ? (
        <>
          <span className="star-symbol">★</span>
          <span className="rating-val">{avg.toFixed(1)}</span>
          <span className="rating-cnt">
            ({count} {count === 1 ? "review" : "reviews"})
          </span>
        </>
      ) : (
        <span className="rating-new">★ New Partner</span>
      )}
    </div>
  );
}
