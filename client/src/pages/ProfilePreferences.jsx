import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui";
import { updateProfile } from "../api/auth";
import { DIETARY_PREFERENCES, ALLERGENS } from "../constants/dietaryOptions";

export default function ProfilePreferences() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [location, setLocation] = useState(user?.location || "");
  const [dietaryPreferences, setDietaryPreferences] = useState(user?.dietaryPreferences || []);
  const [allergies, setAllergies] = useState(user?.allergies || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { user: updated } = await updateProfile({ name, location, dietaryPreferences, allergies });
      updateUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <h2 className="kk-page-title">Profile & Preferences</h2>
      <p className="kk-page-subtitle">
        Your dietary settings power the allergy filter — unsafe menu items are hidden automatically across the platform.
      </p>

      {error && (
        <div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: "var(--kk-green-light)", color: "var(--kk-green)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", marginBottom: 20, fontSize: 13, fontWeight: 500 }}>
          ✓ Profile saved successfully
        </div>
      )}

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Personal Information</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="kk-input-group">
            <label>Name</label>
            <input className="kk-input" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} required />
          </div>
          <div className="kk-input-group">
            <label>Location</label>
            <input className="kk-input" value={location} onChange={(e) => { setLocation(e.target.value); setSaved(false); }} placeholder="e.g. Gulshan, Dhaka" />
          </div>
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Dietary Preferences</h3>
        <p style={{ fontSize: 13, color: "var(--kk-text-muted)", marginBottom: 14 }}>
          Select all that apply. Dishes matching these tags will be prioritised.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DIETARY_PREFERENCES.map((tag) => (
            <span
              key={tag}
              onClick={() => toggle(dietaryPreferences, setDietaryPreferences, tag)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--kk-radius-pill)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: dietaryPreferences.includes(tag) ? "var(--kk-green)" : "var(--kk-bg)",
                color: dietaryPreferences.includes(tag) ? "#fff" : "var(--kk-text-secondary)",
                border: `1px solid ${dietaryPreferences.includes(tag) ? "var(--kk-green)" : "var(--kk-border)"}`,
                transition: "all 0.15s",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Allergies</h3>
        <p style={{ fontSize: 13, color: "var(--kk-text-muted)", marginBottom: 14 }}>
          Dishes containing these allergens will be hidden from menus for your safety.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALLERGENS.map((tag) => (
            <span
              key={tag}
              onClick={() => toggle(allergies, setAllergies, tag)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--kk-radius-pill)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: allergies.includes(tag) ? "var(--kk-red)" : "var(--kk-bg)",
                color: allergies.includes(tag) ? "#fff" : "var(--kk-text-secondary)",
                border: `1px solid ${allergies.includes(tag) ? "var(--kk-red)" : "var(--kk-border)"}`,
                transition: "all 0.15s",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>

      <button
        className="kk-btn kk-btn--primary"
        onClick={handleSubmit}
        disabled={saving}
        style={{ marginBottom: 40 }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </AppLayout>
  );
}