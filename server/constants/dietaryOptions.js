// M1-3 — User Profile & Dietary Preference Management (Mostahid)
//
// Single source of truth for the values a user can pick as a dietary
// preference or an allergy. These MUST stay in sync with the
// dietaryTags / allergens enums on the Dish model (server/models/Dish.js,
// owned by Swapnil / M1-2) — that's what the filter in
// utils/applyDietaryFilter.js compares against.

export const DIETARY_PREFERENCES = [
  "vegan",
  "vegetarian",
  "halal",
  "keto",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "low-carb",
  "high-protein",
];

export const ALLERGENS = [
  "nuts",
  "dairy",
  "shellfish",
  "eggs",
  "soy",
  "gluten",
  "fish",
  "sesame",
];
