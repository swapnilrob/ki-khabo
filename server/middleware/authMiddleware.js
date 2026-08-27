import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorized — token invalid or expired");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error("User no longer exists");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  req.user = user;
  next();
});
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // invalid/expired token on a public route — fall through as a guest
  }
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Access denied — '${req.user.role}' role cannot use this route`)
      );
    }
    next();
  };

// M3-1 / M3-2 (Mostahid) — gates the AI Nutrition Assistant and AI Food
// Image Recognition, both Premium-only per the feature spec. Must run after
// `protect`. An expired premiumExpiry counts as not-premium even if the
// isPremium flag hasn't been flipped back by a cleanup job yet.
export const requirePremium = (req, res, next) => {
  const user = req.user;
  const active = user?.isPremium && (!user.premiumExpiry || user.premiumExpiry > new Date());
  if (!active) {
    res.status(403);
    return next(new Error("This feature requires an active Premium subscription"));
  }
  next();
};