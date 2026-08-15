import StarRating from "./StarRating";

const NUTRIENTS = [
  ["calories", "kcal"],
  ["protein", "protein g"],
  ["carbohydrates", "carbs g"],
  ["fat", "fat g"],
  ["sugar", "sugar g"],
  ["sodium", "sodium mg"],
  ["fiber", "fiber g"],
];

export default function DishCard({ dish, onClick }) {
  const n = dish.nutrition || {};

  return (
    <div
      className="dish-card"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className="dish-top">
        <span className="dish-name">{dish.name}</span>
        <span className="dish-price">৳{dish.price}</span>
      </div>

      {dish.description && <p className="dish-desc">{dish.description}</p>}

      {dish.totalReviews > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating value={dish.averageRating} size={15} />
          <small style={{ color: "#888" }}>
            {dish.averageRating} ({dish.totalReviews})
          </small>
        </div>
      )}

      <div>
        {dish.dietaryTags?.map((t) => (
          <span key={t} className="tag tag-diet">{t}</span>
        ))}
        {dish.allergens?.map((a) => (
          <span key={a} className="tag tag-allergen">contains {a}</span>
        ))}
        {dish.nutritionVerified && (
          <span className="tag tag-verified">✓ verified</span>
        )}
      </div>

      <div className="nutrition-grid">
        {NUTRIENTS.map(([key, label]) => (
          <div key={key} className="nutrition-cell">
            <span className="nutrition-val">{n[key] ?? 0}</span>
            <span className="nutrition-lbl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}