// M1-3 — Allergy & Dietary Preference Filter (Mostahid)
//
// Pure function, deliberately decoupled from Express/Mongoose, so it can be
// unit tested on its own and reused anywhere a list of dishes is shown to a
// user — today that's the restaurant profile page (dishController.js), and
// later Noman's /api/discover search once that lands.
//
// Rules:
//   1. Safety first: a dish is always hidden if it contains ANY allergen
//      the user has flagged, regardless of preferences.
//   2. Relevance: if the user follows one or more diets (e.g. vegan +
//      gluten-free), a dish must carry ALL of those dietaryTags to stay
//      visible — a diet is a hard constraint, not a nice-to-have.
//   3. A guest (no user) or a user with no preferences/allergies set sees
//      everything, unfiltered.
export const applyDietaryFilter = (dishes, user) => {
  const allergies = user?.allergies || [];
  const preferences = user?.dietaryPreferences || [];

  if (allergies.length === 0 && preferences.length === 0) {
    return { visible: dishes, hiddenCount: 0 };
  }

  const visible = dishes.filter((dish) => {
    const allergens = dish.allergens || [];
    const tags = dish.dietaryTags || [];

    const isUnsafe = allergens.some((a) => allergies.includes(a));
    if (isUnsafe) return false;

    const matchesPreferences = preferences.every((p) => tags.includes(p));
    if (preferences.length > 0 && !matchesPreferences) return false;

    return true;
  });

  return { visible, hiddenCount: dishes.length - visible.length };
};
