import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import PremiumGate from "../components/PremiumGate";
import { Card, Badge, DishCard } from "../components/ui";
import { logMeal } from "../api/nutrition";
import { recognizeFood, logRecognizedMeal } from "../api/aiVision";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });

const CONFIDENCE_VARIANT = { high: "success", medium: "info", low: "neutral" };

export default function AiVision() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState(null); // { recognized, remaining, exceedsRemaining, alternatives }
  const [servings, setServings] = useState(1);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [loggedAltIds, setLoggedAltIds] = useState(new Set());
  const [error, setError] = useState("");

  const isPremium = user?.isPremium;

  if (!isPremium) {
    return (
      <AppLayout>
        <h2 className="kk-page-title">AI Food Image Recognition</h2>
        <p className="kk-page-subtitle">Snap a photo, skip the manual data entry.</p>
        <PremiumGate
          icon="📸"
          title="Unlock AI Food Recognition"
          description="Upload a photo of any meal and instantly get its calorie count and full nutrition breakdown — no manual logging needed."
        />
      </AppLayout>
    );
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);
    setLogged(false);
    setLoggedAltIds(new Set());

    if (file.size > MAX_FILE_BYTES) {
      setError("Image is too large (max 5MB)");
      return;
    }

    try {
      const dataUrl = await readAsDataURL(file);
      setPreviewUrl(dataUrl);
      setImageBase64(dataUrl);
    } catch {
      setError("Could not read that image file");
    }
  };

  const handleRecognize = async () => {
    if (!imageBase64) return;
    setRecognizing(true);
    setError("");
    try {
      const res = await recognizeFood(imageBase64);
      setResult(res);
      setServings(1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not recognize this image. Try another photo.");
    } finally {
      setRecognizing(false);
    }
  };

  const handleLog = async () => {
    if (!result) return;
    setLogging(true);
    setError("");
    try {
      const { recognized } = result;
      await logRecognizedMeal({
        foodName: recognized.foodName,
        calories: recognized.calories,
        protein: recognized.protein,
        carbohydrates: recognized.carbohydrates,
        fat: recognized.fat,
        sugar: recognized.sugar,
        fiber: recognized.fiber,
        servings,
      });
      setLogged(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not log this meal");
    } finally {
      setLogging(false);
    }
  };

  const handleLogAlternative = async (dish) => {
    try {
      await logMeal(dish.id, 1, dish.restaurantId);
      setLoggedAltIds((prev) => new Set(prev).add(dish.id));
    } catch {
      setError("Could not log that alternative. Try again.");
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setImageBase64(null);
    setResult(null);
    setLogged(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const recognized = result?.recognized;
  const unrecognized = recognized?.foodName === "Unrecognized";

  return (
    <AppLayout>
      <h2 className="kk-page-title">AI Food Image Recognition</h2>
      <p className="kk-page-subtitle">Upload a photo of your meal — home-cooked or from a restaurant — and get an instant nutrition breakdown.</p>

      {error && <div className="kk-error">{error}</div>}

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div
            style={{
              width: 220, height: 220, borderRadius: "var(--kk-radius)",
              border: "2px dashed var(--kk-border)", display: "flex",
              alignItems: "center", justifyContent: "center", overflow: "hidden",
              background: "var(--kk-bg)", flexShrink: 0, cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Meal preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "var(--kk-text-muted)", fontSize: 13, textAlign: "center", padding: 16 }}>
                📷 Click to choose a photo
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            <button className="kk-btn kk-btn--outline kk-btn--sm" onClick={() => fileInputRef.current?.click()} style={{ alignSelf: "flex-start" }}>
              Choose photo
            </button>
            <button
              className="kk-btn kk-btn--primary"
              onClick={handleRecognize}
              disabled={!imageBase64 || recognizing}
              style={{ alignSelf: "flex-start" }}
            >
              {recognizing ? "Analyzing…" : "Identify meal"}
            </button>
            {(previewUrl || result) && (
              <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={reset} style={{ alignSelf: "flex-start" }}>
                Start over
              </button>
            )}
          </div>
        </div>
      </Card>

      {recognized && (
        <Card style={{ padding: 24, marginBottom: 24 }}>
          {unrecognized ? (
            <p style={{ color: "var(--kk-text-muted)" }}>
              Couldn't identify any food in that photo — try a clearer, closer shot.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{recognized.foodName}</h3>
                  {recognized.estimatedServing && (
                    <p style={{ fontSize: 13, color: "var(--kk-text-muted)" }}>{recognized.estimatedServing}</p>
                  )}
                </div>
                <Badge variant={CONFIDENCE_VARIANT[recognized.confidence]}>{recognized.confidence} confidence</Badge>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  ["calories", "Calories", "kcal"],
                  ["protein", "Protein", "g"],
                  ["carbohydrates", "Carbs", "g"],
                  ["fat", "Fat", "g"],
                  ["sugar", "Sugar", "g"],
                  ["fiber", "Fiber", "g"],
                ].map(([key, label, unit]) => (
                  <div key={key} style={{ background: "var(--kk-bg)", borderRadius: "var(--kk-radius-sm)", padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{Math.round(recognized[key])}{unit}</div>
                    <div style={{ fontSize: 11, color: "var(--kk-text-muted)", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {result.exceedsRemaining && (
                <div style={{ background: "var(--kk-red-light)", color: "var(--kk-red)", padding: "10px 16px", borderRadius: "var(--kk-radius-sm)", fontSize: 13, marginBottom: 16 }}>
                  This meal is {Math.round(recognized.calories - result.remaining.remaining)} kcal over what you have left today ({result.remaining.remaining} kcal remaining). See healthier picks below.
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="kk-input-group" style={{ margin: 0 }}>
                  <label>Servings</label>
                  <input
                    className="kk-input"
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    style={{ width: 90 }}
                  />
                </div>
                <button className="kk-btn kk-btn--primary" onClick={handleLog} disabled={logging || logged} style={{ marginTop: 20 }}>
                  {logged ? "Logged ✓" : logging ? "Logging…" : "Log this meal"}
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {result?.alternatives?.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Healthier picks from the menu</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {result.alternatives.map((dish) => (
              <DishCard
                key={dish.id}
                dish={{ name: dish.name, price: dish.price, calories: dish.calories }}
                onAdd={loggedAltIds.has(dish.id) ? undefined : () => handleLogAlternative(dish)}
              />
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
