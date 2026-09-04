import api from "./axios";

// Distinct cuisines/cities to fill the filter controls.
export const fetchDiscoverFilters = () =>
  api.get("/discover/filters").then((r) => r.data);

// Search + filter. `params` is a plain object like { cuisine: "Mughlai", minRating: 4 }.
// axios turns it into ?cuisine=Mughlai&minRating=4 and drops null/undefined values.
export const searchRestaurants = (params) =>
  api.get("/discover/restaurants", { params }).then((r) => r.data);