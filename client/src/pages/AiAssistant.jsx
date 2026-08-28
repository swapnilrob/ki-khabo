import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import PremiumGate from "../components/PremiumGate";
import { Card, DishCard, SidebarCard } from "../components/ui";
import { logMeal } from "../api/nutrition";
import {
  fetchHealthProfile,
  updateHealthProfile,
  applyTargetGoal,
  sendChatMessage,
  fetchChatHistory,
  clearChatHistory,
} from "../api/aiAssistant";

const ACTIVITY_LEVELS = [
  ["sedentary", "Sedentary (little/no exercise)"],
  ["light", "Light (1-3 days/week)"],
  ["moderate", "Moderate (3-5 days/week)"],
  ["active", "Active (6-7 days/week)"],
  ["very_active", "Very active (hard exercise + physical job)"],
];
const GOALS = [
  ["weight_loss", "Weight loss"],
  ["maintenance", "Maintenance"],
  ["muscle_gain", "Muscle gain"],
];

function HealthProfileForm({ initial, onSaved }) {
  const [form, setForm] = useState({
    heightCm: initial?.heightCm || "",
    weightKg: initial?.weightKg || "",
    age: initial?.age || "",
    sex: initial?.sex || "",
    activityLevel: initial?.activityLevel || "moderate",
    goal: initial?.goal || "maintenance",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        age: Number(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        goal: form.goal,
      };
      const res = await updateHealthProfile(payload);
      onSaved(res);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="kk-input-group">
        <label>Height (cm)</label>
        <input className="kk-input" type="number" min={100} max={250} value={form.heightCm} onChange={set("heightCm")} required />
      </div>
      <div className="kk-input-group">
        <label>Weight (kg)</label>
        <input className="kk-input" type="number" min={30} max={300} value={form.weightKg} onChange={set("weightKg")} required />
      </div>
      <div className="kk-input-group">
        <label>Age</label>
        <input className="kk-input" type="number" min={13} max={100} value={form.age} onChange={set("age")} required />
      </div>
      <div className="kk-input-group">
        <label>Sex</label>
        <select className="kk-input" value={form.sex} onChange={set("sex")} required>
          <option value="" disabled>Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="kk-input-group">
        <label>Activity level</label>
        <select className="kk-input" value={form.activityLevel} onChange={set("activityLevel")}>
          {ACTIVITY_LEVELS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      <div className="kk-input-group">
        <label>Goal</label>
        <select className="kk-input" value={form.goal} onChange={set("goal")}>
          {GOALS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      {error && <div className="kk-error">{error}</div>}
      <button className="kk-btn kk-btn--primary kk-btn--sm" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [calorieInfo, setCalorieInfo] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [applyingGoal, setApplyingGoal] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [lastSuggestions, setLastSuggestions] = useState([]);
  const [loggedIds, setLoggedIds] = useState(new Set());
  const scrollRef = useRef(null);

  const isPremium = user?.isPremium;

  useEffect(() => {
    if (!isPremium) return;
    fetchHealthProfile().then((res) => {
      setProfile(res.healthProfile);
      setCalorieInfo(res.calorieInfo);
      if (!res.calorieInfo.isComplete) setEditingProfile(true);
    });
    fetchChatHistory().then((res) => setMessages(res.messages || []));
  }, [isPremium]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!isPremium) {
    return (
      <AppLayout>
        <h2 className="kk-page-title">AI Nutrition &amp; Diet Assistant</h2>
        <p className="kk-page-subtitle">A 24/7 AI nutrition coach personalized to your goals.</p>
        <PremiumGate
          icon="🤖"
          title="Unlock your AI Nutrition Assistant"
          description="Get a personalized calorie target, real-time meal suggestions from the platform's menu, and diet advice tailored to your goal — available around the clock."
        />
      </AppLayout>
    );
  }

  const handleProfileSaved = (res) => {
    setProfile(res.healthProfile);
    setCalorieInfo(res.calorieInfo);
    setEditingProfile(false);
  };

  const handleApplyGoal = async () => {
    setApplyingGoal(true);
    try {
      await applyTargetGoal();
    } catch (err) {
      setError(err.response?.data?.message || "Could not apply the target as your goal");
    } finally {
      setApplyingGoal(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text, _id: `local-${Date.now()}` }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, _id: res.messageId }]);
      setCalorieInfo(res.calorieInfo);
      setRemaining(res.remaining);
      setLastSuggestions(res.suggestedDishes || []);
    } catch (err) {
      setError(err.response?.data?.message || "The assistant couldn't respond. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    await clearChatHistory();
    setMessages([]);
    setLastSuggestions([]);
  };

  const handleLogSuggestion = async (dish) => {
    try {
      await logMeal(dish.id, 1, dish.restaurantId);
      setLoggedIds((prev) => new Set(prev).add(dish.id));
    } catch {
      setError("Could not log that meal. Try again.");
    }
  };

  const sidebar = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SidebarCard title="Your health profile">
        {editingProfile ? (
          <HealthProfileForm initial={profile} onSaved={handleProfileSaved} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {calorieInfo?.isComplete ? (
              <>
                <div style={{ fontSize: 13, color: "var(--kk-text-secondary)" }}>
                  BMR: <strong>{calorieInfo.bmr} kcal</strong><br />
                  TDEE: <strong>{calorieInfo.tdee} kcal</strong><br />
                  Target: <strong style={{ color: "var(--kk-orange)" }}>{calorieInfo.target} kcal</strong>
                </div>
                <button className="kk-btn kk-btn--secondary kk-btn--sm" onClick={handleApplyGoal} disabled={applyingGoal}>
                  {applyingGoal ? "Applying…" : "Apply as my daily goal"}
                </button>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "var(--kk-text-muted)" }}>
                Complete your profile to get a personalized calorie target.
              </p>
            )}
            <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={() => setEditingProfile(true)}>
              Edit profile
            </button>
          </div>
        )}
      </SidebarCard>

      {remaining && (
        <SidebarCard title="Today so far">
          <p style={{ fontSize: 13 }}>
            {remaining.consumed} / {remaining.goal} kcal eaten<br />
            <strong>{remaining.remaining} kcal</strong> remaining
          </p>
        </SidebarCard>
      )}

      <button className="kk-btn kk-btn--ghost kk-btn--sm" onClick={handleClear}>
        Clear chat history
      </button>
    </div>
  );

  return (
    <AppLayout sidebar={sidebar}>
      <h2 className="kk-page-title">AI Nutrition &amp; Diet Assistant</h2>
      <p className="kk-page-subtitle">Ask about meals, your calorie budget, or advice toward your goal.</p>

      {error && <div className="kk-error">{error}</div>}

      <Card style={{ padding: 0, display: "flex", flexDirection: "column", height: 480, marginBottom: 20 }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--kk-text-muted)", fontSize: 13, textAlign: "center", marginTop: 40 }}>
              Say hello — ask "what should I eat right now?" or "how many calories do I have left today?"
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m._id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "75%",
                background: m.role === "user" ? "var(--kk-orange)" : "var(--kk-bg)",
                color: m.role === "user" ? "#fff" : "var(--kk-text)",
                padding: "10px 14px",
                borderRadius: "var(--kk-radius)",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div style={{ alignSelf: "flex-start", color: "var(--kk-text-muted)", fontSize: 13 }}>
              Thinking…
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid var(--kk-border-light)" }}>
          <input
            className="kk-input"
            placeholder="Ask your nutrition assistant…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button className="kk-btn kk-btn--primary" type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </Card>

      {lastSuggestions.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Suggested from the menu</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {lastSuggestions.map((dish) => (
              <DishCard
                key={dish.id}
                dish={{ name: dish.name, price: dish.price, calories: dish.calories }}
                onAdd={loggedIds.has(dish.id) ? undefined : () => handleLogSuggestion(dish)}
              />
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
