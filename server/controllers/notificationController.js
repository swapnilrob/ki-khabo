import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

// @desc   Get logged-in user's notifications
// @route  GET /api/notifications
// @access Private
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.json({ success: true, notifications, unreadCount });
});

// @desc   Mark one notification as read
// @route  PATCH /api/notifications/:id/read
// @access Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notif) { res.status(404); throw new Error("Notification not found"); }

  notif.isRead = true;
  await notif.save();
  res.json({ success: true });
});

// @desc   Mark all notifications as read
// @route  PATCH /api/notifications/read-all
// @access Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// @desc   Delete a notification
// @route  DELETE /api/notifications/:id
// @access Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notif) { res.status(404); throw new Error("Notification not found"); }

  await notif.deleteOne();
  res.json({ success: true });
});