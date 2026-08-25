import { useState } from "react";
import Badge from "./Badge";
import StarRating from "./StarRating";
import "./DishCard.css";

/**
 * Dish card matching the reference design.
 *
 * Props:
 *   dish       — { _id, name, description, price, image, dietaryTags, averageRating, totalReviews, calories }
 *   onAdd      — () => void   (meal planner / order action)
 *   onFavorite — () => void   (save to favorites)
 *   isFavorited — boolean
 *   children   — optional expandable content (review section, nutrition details)
 */
export default function DishCard({
  dish,
  onAdd,
  onFavorite,
  isFavorited = false,
  children,
}) {
  const [expanded, setExpanded] = useState(false);

  const tagVariant = (tag) => {
    const lower = tag.toLowerCase();
    if (lower.includes("spicy")) return "spicy";
    return "default";
  };

  return (
    <div className="kk-dish-card">
      {/* ── Image ── */}
      <div className="kk-dish-card__img-wrap">
        {dish.image ? (
          <img
            src={dish.image}
            alt={dish.name}
            className="kk-dish-card__img"
            loading="lazy"
          />
        ) : (
          <div className="kk-dish-card__img-placeholder">
            <span>🍽️</span>
          </div>
        )}

        {onFavorite && (
          <button
            className={`kk-dish-card__fav ${isFavorited ? "kk-dish-card__fav--active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg viewBox="0 0 20 20" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="kk-dish-card__body">
        <h4 className="kk-dish-card__name">{dish.name}</h4>

        {dish.description && (
          <p className="kk-dish-card__desc">
            {dish.description.length > 80
              ? dish.description.slice(0, 80) + "…"
              : dish.description}
          </p>
        )}

        {/* Tags */}
        {dish.dietaryTags?.length > 0 && (
          <div className="kk-dish-card__tags">
            {dish.dietaryTags.map((tag) => (
              <Badge key={tag} variant={tagVariant(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Meta row: rating, price, calories */}
        <div className="kk-dish-card__meta">
          {dish.averageRating > 0 && (
            <StarRating value={dish.averageRating} size="sm" />
          )}
          {dish.calories > 0 && (
            <span className="kk-dish-card__cal">{dish.calories} kcal</span>
          )}
        </div>

        {/* Footer: price + add button */}
        <div className="kk-dish-card__footer">
          {dish.price != null && (
            <span className="kk-dish-card__price">
              ৳{dish.price}
            </span>
          )}

          <div className="kk-dish-card__actions">
            {children && (
              <button
                className="kk-btn kk-btn--ghost kk-btn--sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Less" : "Reviews"}
              </button>
            )}
            {onAdd && (
              <button className="kk-btn kk-btn--primary kk-btn--sm" onClick={onAdd}>
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Expandable section (reviews, nutrition) ── */}
      {expanded && children && (
        <div className="kk-dish-card__expand">{children}</div>
      )}
    </div>
  );
}
