import { useState } from "react";
import { Link } from "react-router-dom";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import StarRating from "./StarRating";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Fallback centre = Dhaka, used when we have no user location and no markers.
const DHAKA = { lat: 23.7806, lng: 90.4193 };

// A restaurant only goes on the map if it has real coordinates.
// GeoJSON stores them as [longitude, latitude]; Google wants { lat, lng }.
const toLatLng = (r) => {
  const [lng, lat] = r.location?.coordinates || [0, 0];
  if (lat === 0 && lng === 0) return null; // default/unset location — skip it
  return { lat, lng };
};

export default function RestaurantMap({ restaurants = [], userCoords = null }) {
  const [openId, setOpenId] = useState(null); // which info window is open

  if (!API_KEY) {
    return (
      <div className="map-missing-key">
        <p>🗺️ Map needs a Google Maps API key.</p>
        <p style={{ fontSize: 13, color: "#666" }}>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>client/.env</code>,
          then restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  // Keep only restaurants we can actually plot.
  const pins = restaurants
    .map((r) => ({ r, pos: toLatLng(r) }))
    .filter((x) => x.pos);

  // Centre priority: the user's location -> first pin -> Dhaka.
  const center = userCoords || pins[0]?.pos || DHAKA;

  return (
    <div className="map-wrap">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {/* The user's own position (blue pin) */}
          {userCoords && (
            <AdvancedMarker position={userCoords} title="You are here">
              <Pin background="#1a73e8" borderColor="#0b4fa0" glyphColor="#fff" />
            </AdvancedMarker>
          )}

          {/* One red pin per restaurant */}
          {pins.map(({ r, pos }) => (
            <AdvancedMarker
              key={r._id}
              position={pos}
              onClick={() => setOpenId(r._id)}
            >
              <Pin background="#d64545" borderColor="#8f2b2b" glyphColor="#fff" />
            </AdvancedMarker>
          ))}

          {/* Info window for the clicked restaurant */}
          {pins.map(({ r, pos }) =>
            openId === r._id ? (
              <InfoWindow
                key={`iw-${r._id}`}
                position={pos}
                onCloseClick={() => setOpenId(null)}
              >
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {r.businessName}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    {r.city} · {r.priceRange}
                  </div>
                  <StarRating value={r.averageRating} size={13} />
                  {typeof r.distance === "number" && (
                    <div style={{ fontSize: 12, color: "#1a56db", marginTop: 4 }}>
                      {(r.distance / 1000).toFixed(1)} km away
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <Link to={`/restaurant/${r._id}`}>View menu →</Link>
                  </div>
                </div>
              </InfoWindow>
            ) : null
          )}
        </Map>
      </APIProvider>
    </div>
  );
}