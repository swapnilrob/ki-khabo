import "./CategoryTabs.css";

/**
 * Horizontal scrollable tab bar for menu categories.
 *
 *   <CategoryTabs
 *     items={["All", "Starters", "Main Course", "Desserts", "Healthy Choices"]}
 *     active="All"
 *     onChange={(tab) => setFilter(tab)}
 *   />
 */
export default function CategoryTabs({ items = [], active, onChange, className = "" }) {
  return (
    <div className={`kk-tabs ${className}`} role="tablist">
      {items.map((item) => (
        <button
          key={item}
          role="tab"
          aria-selected={item === active}
          className={`kk-tabs__tab ${item === active ? "kk-tabs__tab--active" : ""}`}
          onClick={() => onChange?.(item)}
        >
          {item}
          {item !== items[items.length - 1] && (
            <span className="kk-tabs__chevron" aria-hidden="true">
              ›
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
