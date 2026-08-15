import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api/auth";
import { DIETARY_PREFERENCES, ALLERGENS } from "../constants/dietaryOptions";
import "../styles/profile.css";

// M1-3 — User Profile & Dietary Preference Management (Mostahid)
// These settings feed the Allergy & Dietary Preference Filter applied
// server-side in dishController.getRestaurantProfile (via applyDietaryFilter).
export default function ProfilePreferences() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [location, setLocation] = useState(user?.location || "");
  const [dietaryPreferences, setDietaryPreferences] = useState(
    user?.dietaryPreferences || []
  );
  const [allergies, setAllergies] = useState(user?.allergies || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { user: updated } = await updateProfile({
        name,
        location,
        dietaryPreferences,
        allergies,
      });
      updateUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prefs-page">
      <Link to="/app">← Back to dashboard</Link>
      <h1>Profile &amp; Dietary Preferences</h1>
      <p style={{ color: "#666" }}>
        These settings power your Allergy &amp; Dietary Preference Filter —
        menu items that don't match are hidden automatically wherever you
        browse the platform.
      </p>

      <form onSubmit={handleSubmit} className="profile-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Gulshan, Dhaka"
          />
        </label>

        <fieldset>
          <legend>Dietary preferences</legend>
          <div className="chip-grid">
            {DIETARY_PREFERENCES.map((tag) => (
              <label
                key={tag}
                className={`chip ${dietaryPreferences.includes(tag) ? "chip-active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={dietaryPreferences.includes(tag)}
                  onChange={() => toggle(dietaryPreferences, setDietaryPreferences, tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Allergies</legend>
          <div className="chip-grid">
            {ALLERGENS.map((tag) => (
              <label
                key={tag}
                className={`chip chip-allergen ${allergies.includes(tag) ? "chip-active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={allergies.includes(tag)}
                  onChange={() => toggle(allergies, setAllergies, tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        {saved && <p className="saved-msg">Saved ✓</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
