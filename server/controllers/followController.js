import asyncHandler from "express-async-handler";
import Follow from "../models/Follow.js";
import User from "../models/User.js";

// Shape a followed/follower user for the client — never leak password/email list-wide
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  location: u.location,
});

// @desc   Follow another user
// @route  POST /api/follows/:userId
// @access Private (user)
export const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;

  if (targetId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You can't follow yourself");
  }

  const target = await User.findById(targetId);
  if (!target) {
    res.status(404);
    throw new Error("User not found");
  }

  // Friendly duplicate check (the unique index is the real guarantee)
  const exists = await Follow.findOne({ follower: req.user._id, following: targetId });
  if (exists) {
    res.status(409);
    throw new Error("You already follow this user");
  }

  await Follow.create({ follower: req.user._id, following: targetId });

  const counts = await Follow.getCounts(targetId);
  res.status(201).json({ success: true, message: "Followed", counts });
});

// @desc   Unfollow a user
// @route  DELETE /api/follows/:userId
// @access Private (user)
export const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;

  const edge = await Follow.findOneAndDelete({
    follower: req.user._id,
    following: targetId,
  });
  if (!edge) {
    res.status(404);
    throw new Error("You don't follow this user");
  }

  const counts = await Follow.getCounts(targetId);
  res.json({ success: true, message: "Unfollowed", counts });
});

// @desc   Followers of a user (public profile stat)
// @route  GET /api/follows/:userId/followers
// @access Public
export const getFollowers = asyncHandler(async (req, res) => {
  const edges = await Follow.find({ following: req.params.userId }).populate(
    "follower",
    "name location"
  );
  res.json({
    success: true,
    count: edges.length,
    followers: edges.map((e) => publicUser(e.follower)),
  });
});

// @desc   Who a user follows
// @route  GET /api/follows/:userId/following
// @access Public
export const getFollowing = asyncHandler(async (req, res) => {
  const edges = await Follow.find({ follower: req.params.userId }).populate(
    "following",
    "name location"
  );
  res.json({
    success: true,
    count: edges.length,
    following: edges.map((e) => publicUser(e.following)),
  });
});

// @desc   Does the logged-in user follow :userId? (for the follow button state)
// @route  GET /api/follows/:userId/status
// @access Private (user)
export const getFollowStatus = asyncHandler(async (req, res) => {
  const edge = await Follow.findOne({
    follower: req.user._id,
    following: req.params.userId,
  });
  const counts = await Follow.getCounts(req.params.userId);
  res.json({ success: true, isFollowing: !!edge, counts });
});