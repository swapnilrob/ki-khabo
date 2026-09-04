import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import RewardHistory from "../models/RewardHistory.js";
// import { awardPoints } from "./rewardController.js"; 

// Points awarded per action
const POINTS_TABLE = {
  review_written: 50,
  subscription_purchased: 200,
  subscription_renewed: 300,
  meal_plan_completed: 100,
};

// Helper — award points to a user (called by other controllers too)
export const awardPoints = async (userId, action, description, referenceId = null) => {
  const user = await User.findById(userId);
  if (!user || !user.isPremium) return null;

  const points = POINTS_TABLE[action]; 
  if (!points) return null;

  user.rewardPoints += points;
  await user.save();

  const record = await RewardHistory.create({
    user: userId,
    points,
    action,
    description,
    reference: referenceId,
  });

  return { points, total: user.rewardPoints, record };
};

// @desc   Get reward points summary and history
// @route  GET /api/rewards
// @access Private
export const getRewards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const history = await RewardHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });

  const discountValue =
    settings.pointsPerTaka > 0
      ? Math.floor(user.rewardPoints / settings.pointsPerTaka)
      : 0;

  res.json({
    success: true,
    rewardPoints: user.rewardPoints,
    pointsPerTaka: settings.pointsPerTaka,
    discountValue,
    pointsTable: POINTS_TABLE,
    history,
  });
});

// @desc   Redeem points for subscription discount
// @route  POST /api/rewards/redeem
// @access Private
export const redeemPoints = asyncHandler(async (req, res) => {
  const { pointsToRedeem } = req.body;

  const user = await User.findById(req.user._id);

  if (!user.isPremium) {
    res.status(400);
    throw new Error("Only premium users can redeem points");
  }

  if (!pointsToRedeem || pointsToRedeem <= 0) {
    res.status(400);
    throw new Error("Please specify a valid number of points to redeem");
  }

  if (pointsToRedeem > user.rewardPoints) {
    res.status(400);
    throw new Error(`You only have ${user.rewardPoints} points available`);
  }

  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });

  const discount = Math.floor(pointsToRedeem / settings.pointsPerTaka);

  if (discount < 1) {
    res.status(400);
    throw new Error(
      `You need at least ${settings.pointsPerTaka} points for ৳1 discount`
    );
  }

  user.rewardPoints -= pointsToRedeem;
  await user.save();

  await RewardHistory.create({
    user: req.user._id,
    points: -pointsToRedeem,
    action: "points_redeemed",
    description: `Redeemed ${pointsToRedeem} points for ৳${discount} discount`,
  });

  res.json({
    success: true,
    message: `Redeemed ${pointsToRedeem} points for ৳${discount} discount`,
    discount,
    remainingPoints: user.rewardPoints,
  });
}); 