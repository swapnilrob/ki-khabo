import "./Card.css";

/**
 * Generic card wrapper.
 * 
 *   <Card>...</Card>
 *   <Card hover>Lifts on hover</Card>
 *   <Card compact>Tighter padding</Card>
 *   <Card transparent>No bg/shadow (for grouping)</Card>
 */
export default function Card({
  children,
  hover = false,
  compact = false,
  transparent = false,
  className = "",
  ...rest
}) {
  const cls = [
    "kk-card",
    hover && "kk-card--hover",
    compact && "kk-card--compact",
    transparent && "kk-card--transparent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
