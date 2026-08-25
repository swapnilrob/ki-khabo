import "./Badge.css";

/**
 * Small tag/badge for dietary labels, status, etc.
 *
 *   <Badge>Halal</Badge>
 *   <Badge variant="spicy">Spicy</Badge>
 *   <Badge variant="success">Approved</Badge>
 *   <Badge variant="danger">Rejected</Badge>
 *   <Badge variant="info">Premium</Badge>
 *   <Badge variant="neutral">Pending</Badge>
 */

const VARIANT_MAP = {
  default:  "kk-badge--default",
  spicy:    "kk-badge--spicy",
  success:  "kk-badge--success",
  danger:   "kk-badge--danger",
  info:     "kk-badge--info",
  neutral:  "kk-badge--neutral",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`kk-badge ${VARIANT_MAP[variant] || VARIANT_MAP.default} ${className}`}>
      {children}
    </span>
  );
}
