import Navbar from "./Navbar";
import "./AppLayout.css";

/**
 * Three-column layout matching the reference design.
 *
 * Usage:
 *   <AppLayout
 *     sidebar={<RestaurantSidebar />}      // optional left sidebar
 *     aside={<AISuggestions />}            // optional right sidebar
 *   >
 *     <HeroBanner />
 *     <DishGrid />
 *   </AppLayout>
 *
 * Pass no sidebar/aside for a single-column centered layout (auth pages).
 * Pass only children for a full-width center column.
 */
export default function AppLayout({ sidebar, aside, children, className = "" }) {
  const hasSidebar = !!sidebar;
  const hasAside = !!aside;

  return (
    <div className="kk-app">
      <Navbar />

      <div
        className={`kk-layout ${
          hasSidebar ? "kk-layout--has-sidebar" : ""
        } ${hasAside ? "kk-layout--has-aside" : ""} ${className}`}
      >
        {hasSidebar && (
          <aside className="kk-layout__sidebar">{sidebar}</aside>
        )}

        <main className="kk-layout__main">{children}</main>

        {hasAside && (
          <aside className="kk-layout__aside">{aside}</aside>
        )}
      </div>
    </div>
  );
}
