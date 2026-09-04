import "./SidebarCard.css";

/**
 * Sidebar section card with an optional heading.
 *
 *   <SidebarCard title="Restaurant Profile">
 *     <p>The Spice Artisan</p>
 *   </SidebarCard>
 */
export default function SidebarCard({ title, icon, children, className = "" }) {
  return (
    <div className={`kk-sidebar-card ${className}`}>
      {title && (
        <div className="kk-sidebar-card__header">
          {icon && <span className="kk-sidebar-card__icon">{icon}</span>}
          <h3 className="kk-sidebar-card__title">{title}</h3>
        </div>
      )}
      <div className="kk-sidebar-card__body">{children}</div>
    </div>
  );
}

/**
 * A compact list item for the sidebar (AI suggestion, recommendation).
 *
 *   <SidebarItem
 *     image="/thumb.jpg"
 *     title="Spicy Shrimp"
 *     subtitle="Recommended based on your preferences."
 *     onClick={() => navigate(`/dish/${id}`)}
 *   />
 */
export function SidebarItem({ image, title, subtitle, onClick }) {
  return (
    <button className="kk-sidebar-item" onClick={onClick}>
      {image ? (
        <img src={image} alt="" className="kk-sidebar-item__img" loading="lazy" />
      ) : (
        <div className="kk-sidebar-item__img kk-sidebar-item__img--placeholder">🍽️</div>
      )}
      <div className="kk-sidebar-item__text">
        <span className="kk-sidebar-item__title">{title}</span>
        {subtitle && <span className="kk-sidebar-item__sub">{subtitle}</span>}
      </div>
    </button>
  );
}
