import api from "./axios";

export const fetchNotifications = () =>
  api.get("/notifications").then((r) => r.data);

export const markAsRead = (id) =>
  api.patch("/notifications/" + id + "/read").then((r) => r.data);

export const markAllAsRead = () =>
  api.patch("/notifications/read-all").then((r) => r.data);

export const deleteNotification = (id) =>
  api.delete("/notifications/" + id).then((r) => r.data);