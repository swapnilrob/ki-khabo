import api from "./axios";

// M1-3 — save name/location/dietaryPreferences/allergies for the logged-in user
export const updateProfile = (payload) =>
  api.put("/auth/me", payload).then((r) => r.data);
