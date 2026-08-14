import StarRating from "./StarRating";

/**
 * ReviewList — displays reviews + an aggregate header.
 *
 * Props:
 *   reviews   array    the review objects to render
 *   average   number   optional — aggregate average to show in the header
 *   count     number   optional — how many reviews the average is based on
 *   title     string   optional header label (default "Reviews")
 */
export default function ReviewList({ reviews = [], average, count, title = "Reviews" }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        {average != null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <StarRating value={average} size={18} />
            <strong>{average.toFixed(1)}</strong>
            <span style={{ color: "#888", fontSize: 14 }}>
              ({count ?? reviews.length})
            </span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: "#888" }}>No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            style={{
              borderBottom: "1px solid #eee",
              padding: "12px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarRating value={r.rating} size={16} />
              <strong>{r.user?.name || "Anonymous"}</strong>
              <span style={{ color: "#aaa", fontSize: 13 }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>

            {r.comment && (
              <p style={{ margin: "6px 0 0", color: "#333" }}>{r.comment}</p>
            )}

            {/* Owner's public reply, if present */}
            {r.ownerResponse && (
              <div
                style={{
                  marginTop: 8,
                  marginLeft: 16,
                  padding: "8px 12px",
                  background: "#f6f8fa",
                  borderLeft: "3px solid #2563eb",
                  borderRadius: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>
                  Owner's response
                </span>
                <p style={{ margin: "4px 0 0", color: "#444", fontSize: 14 }}>
                  {r.ownerResponse.text}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}   