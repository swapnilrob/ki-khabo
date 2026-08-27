import api from "./axios";

export const placeOrder = (restaurantId, items) =>
  api.post("/orders", { restaurantId, items }).then((r) => r.data);

export const reserveTable = (payload) =>
  api.post("/orders/reserve", payload).then((r) => r.data);

export const fetchMyOrders = (params) =>
  api.get("/orders/my", { params }).then((r) => r.data);

export const cancelOrder = (id) =>
  api.patch(`/orders/${id}/cancel`).then((r) => r.data);

export const acceptReschedule = (id) =>
  api.patch(`/orders/${id}/accept-reschedule`).then((r) => r.data);

export const fetchRestaurantOrders = (params) =>
  api.get("/orders/restaurant", { params }).then((r) => r.data);

export const approveOrder = (id) =>
  api.patch(`/orders/${id}/approve`).then((r) => r.data);

export const rejectOrder = (id, reason) =>
  api.patch(`/orders/${id}/reject`, { reason }).then((r) => r.data);

export const rescheduleOrder = (id, newDate, newTime) =>
  api.patch(`/orders/${id}/reschedule`, { newDate, newTime }).then((r) => r.data);

export const completeOrder = (id) =>
  api.patch(`/orders/${id}/complete`).then((r) => r.data);