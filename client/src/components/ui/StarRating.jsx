import "./StarRating.css";

/**
 * Star rating display.
 *
 *   <StarRating value={4.8} />
 *   <StarRating value={3.5} count={24} />
 *   <StarRating value={0} size="sm" />
 */
export default function StarRating({ value = 0, count, size = "md", className = "" }) {
  const stars = [];
  const rounded = Math.round(value * 2) / 2; // round to nearest 0.5

  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push("full");
    } else if (i - 0.5 === rounded) {
      stars.push("half");
    } else {
      stars.push("empty");
    }
  }

  return (
    <span className={`kk-stars kk-stars--${size} ${className}`}>
      <span className="kk-stars__icons">
        {stars.map((type, idx) => (
          <svg
            key={idx}
            className={`kk-stars__star kk-stars__star--${type}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {type === "half" ? (
              <>
                <defs>
                  <linearGradient id={`half-${idx}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#half-${idx})`}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </>
            ) : (
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            )}
          </svg>
        ))}
      </span>
      {value > 0 && <span className="kk-stars__value">{value.toFixed(1)}</span>}
      {count != null && <span className="kk-stars__count">({count})</span>}
    </span>
  );
}
