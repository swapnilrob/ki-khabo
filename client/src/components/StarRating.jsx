import { useState } from "react";

/**
 * StarRating
 * - Read-only:  <StarRating value={4.2} />
 * - Editable:   <StarRating value={rating} onChange={setRating} editable />
 *
 * Props:
 *   value     number  current rating (supports decimals when read-only)
 *   onChange  fn      called with 1..5 when a star is clicked (editable mode)
 *   editable  bool    makes stars clickable
 *   size      number  font size in px (default 22)
 */
export default function StarRating({
  value = 0,
  onChange,
  editable = false,
  size = 22,
}) {
  const [hover, setHover] = useState(0);

  const stars = [1, 2, 3, 4, 5];

  return (
    <span style={{ display: "inline-flex", gap: 2, lineHeight: 1 }}>
      {stars.map((star) => {
        // In editable mode, the hovered star (and those before it) light up.
        // In read-only mode, we fill based on the actual value (rounded).
        const active = editable
          ? star <= (hover || value)
          : star <= Math.round(value);

        return (
          <span
            key={star}
            onClick={editable ? () => onChange?.(star) : undefined}
            onMouseEnter={editable ? () => setHover(star) : undefined}
            onMouseLeave={editable ? () => setHover(0) : undefined}
            style={{
              cursor: editable ? "pointer" : "default",
              fontSize: size,
              color: active ? "#f5a623" : "#d0d0d0",
              transition: "color 0.12s",
              userSelect: "none",
            }}
            role={editable ? "button" : undefined}
            aria-label={editable ? `Rate ${star} star${star > 1 ? "s" : ""}` : undefined}
          >
            ★
          </span>
        );
      })}
    </span>
  );
} 