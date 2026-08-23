import api from "./axios";

// ── Follow ──
export const followUser = (userId) =>
  api.post(`/follows/${userId}`).then((r) => r.data);

export const unfollowUser = (userId) =>
  api.delete(`/follows/${userId}`).then((r) => r.data);

export const getFollowStatus = (userId) =>
  api.get(`/follows/${userId}/status`).then((r) => r.data);

export const getFollowers = (userId) =>
  api.get(`/follows/${userId}/followers`).then((r) => r.data);

export const getFollowing = (userId) =>
  api.get(`/follows/${userId}/following`).then((r) => r.data);

export const searchUsers = (q) =>
  api.get(`/follows/search`, { params: { q } }).then((r) => r.data); 

// ── Saved Dishes ──
export const saveDish = (dish, collectionName) =>
  api.post("/saved-dishes", { dish, collectionName }).then((r) => r.data);

export const unsaveDish = (id) =>
  api.delete(`/saved-dishes/${id}`).then((r) => r.data);

export const getMySavedDishes = (collection) =>
  api.get("/saved-dishes/mine", { params: collection ? { collection } : {} }).then((r) => r.data);

export const getMyCollections = () =>
  api.get("/saved-dishes/collections").then((r) => r.data);

// ── Food Lists ──
export const createFoodList = (payload) =>
  api.post("/food-lists", payload).then((r) => r.data);

export const getPublicFoodLists = (search) =>
  api.get("/food-lists", { params: search ? { search } : {} }).then((r) => r.data);

export const getMyFoodLists = () =>
  api.get("/food-lists/mine").then((r) => r.data);

export const getFoodListById = (id) =>
  api.get(`/food-lists/${id}`).then((r) => r.data);

export const updateFoodList = (id, payload) =>
  api.put(`/food-lists/${id}`, payload).then((r) => r.data);

export const deleteFoodList = (id) =>
  api.delete(`/food-lists/${id}`).then((r) => r.data);

export const addItemToList = (listId, payload) =>
  api.post(`/food-lists/${listId}/items`, payload).then((r) => r.data);

export const removeItemFromList = (listId, itemId) =>
  api.delete(`/food-lists/${listId}/items/${itemId}`).then((r) => r.data);

// ── Feed ──
export const getFeed = () =>
  api.get("/feed").then((r) => r.data);   