// M3-1 — AI Nutrition & Diet Assistant (Mostahid)
//
// Deterministic calorie math, kept separate from the AI call itself: the
// LLM gives conversational advice, but the actual number is always computed
// here so it's consistent, testable, and never hallucinated.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,     // little/no exercise
  light: 1.375,       // light exercise 1-3 days/week
  moderate: 1.55,     // moderate exercise 3-5 days/week
  active: 1.725,      // hard exercise 6-7 days/week
  very_active: 1.9,   // very hard exercise + physical job
};

const GOAL_ADJUSTMENTS = {
  weight_loss: -500,
  maintenance: 0,
  muscle_gain: 300,
};

const REQUIRED_FIELDS = ["heightCm", "weightKg", "age", "sex"];

// Mifflin-St Jeor BMR (kcal/day at total rest)
const calculateBMR = ({ heightCm, weightKg, age, sex }) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
};

// Returns { isComplete, missingFields, bmr, tdee, target } — bmr/tdee/target
// are null when the profile is incomplete, so callers can prompt the user
// for what's missing rather than silently showing a wrong number.
export const calculateDailyCalorieTarget = (healthProfile = {}) => {
  const missingFields = REQUIRED_FIELDS.filter(
    (f) => healthProfile[f] === undefined || healthProfile[f] === null || healthProfile[f] === ""
  );

  if (missingFields.length > 0) {
    return { isComplete: false, missingFields, bmr: null, tdee: null, target: null };
  }

  const bmr = calculateBMR(healthProfile);
  const activityLevel = healthProfile.activityLevel || "moderate";
  const goal = healthProfile.goal || "maintenance";

  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate);
  const target = Math.max(1200, tdee + (GOAL_ADJUSTMENTS[goal] ?? 0));

  return {
    isComplete: true,
    missingFields: [],
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
  };
};

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);
export const GOALS = Object.keys(GOAL_ADJUSTMENTS);
