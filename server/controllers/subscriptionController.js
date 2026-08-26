import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Settings from "../models/Settings.js";

// Generate a fake transaction ID (simulating bKash/SSLCommerz)
const generateTransactionId = (method) => {
  const prefix = method === "bkash" ? "BK" : "SSL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// @desc   Get subscription plans and pricing
// @route  GET /api/subscription/plans
// @access Public
export const getPlans = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });

  res.json({
    success: true,
    plans: {
      monthly: {
        name: "Monthly Premium",
        price: settings.monthlyPrice,
        duration: "1 month",
      },
      yearly: {
        name: "Yearly Premium",
        price: settings.yearlyPrice,
        duration: "1 year",
        savings: settings.monthlyPrice * 12 - settings.yearlyPrice,
      },
    },
    features: {
      free: [
        "Search & discover restaurants",
        "Browse menus with nutrition info",
        "Write reviews & ratings",
        "Smart Meal Planner",
        "Community features",
      ],
      premium: [
        "Everything in Free",
        "AI Nutrition & Diet Assistant",
        "AI Food Image Recognition",
        "Loyalty discount access",
        "Priority support",
      ],
    },
  });
});

// @desc   Subscribe to premium
// @route  POST /api/subscription/subscribe
// @access Private (user only)
export const subscribe = asyncHandler(async (req, res) => {
  const { plan, paymentMethod, paymentNumber } = req.body;

  if (!plan || !paymentMethod) {
    res.status(400);
    throw new Error("Plan and payment method are required");
  }

  if (!["monthly", "yearly"].includes(plan)) {
    res.status(400);
    throw new Error("Plan must be 'monthly' or 'yearly'");
  }

  if (!["bkash", "sslcommerz"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Payment method must be 'bkash' or 'sslcommerz'");
  }

  if (paymentMethod === "bkash" && !paymentNumber) {
    res.status(400);
    throw new Error("bKash number is required");
  }

  // Check if user already has an active subscription
  const user = await User.findById(req.user._id);
  if (user.isPremium && user.premiumExpiry && user.premiumExpiry > new Date()) {
    res.status(400);
    throw new Error(
      `You already have an active premium subscription until ${user.premiumExpiry.toLocaleDateString()}`
    );
  }

  // Get pricing from settings
  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });

  const amount = plan === "monthly" ? settings.monthlyPrice : settings.yearlyPrice;

  // Simulate payment processing
  const transactionId = generateTransactionId(paymentMethod);

  // Calculate subscription dates
  const startDate = new Date();
  const endDate = new Date();
  if (plan === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Create subscription record
  const subscription = await Subscription.create({
    user: req.user._id,
    plan,
    amount,
    paymentMethod,
    transactionId,
    status: "active",
    startDate,
    endDate,
  });

  // Activate premium on user
  user.isPremium = true;
  user.premiumExpiry = endDate;
  user.subscriptionPlan = plan;
  await user.save();

  res.status(201).json({
    success: true,
    message: "Premium subscription activated successfully!",
    subscription: {
      id: subscription._id,
      plan: subscription.plan,
      amount: subscription.amount,
      paymentMethod: subscription.paymentMethod,
      transactionId: subscription.transactionId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
    },
  });
});

// @desc   Get current subscription status
// @route  GET /api/subscription/status
// @access Private
export const getStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const activeSubscription = await Subscription.findOne({
    user: req.user._id,
    status: "active",
  }).sort({ createdAt: -1 });

  // Auto-expire if past end date
  if (activeSubscription && activeSubscription.endDate < new Date()) {
    activeSubscription.status = "expired";
    await activeSubscription.save();
    user.isPremium = false;
    user.premiumExpiry = null;
    user.subscriptionPlan = null;
    await user.save();
  }

  res.json({
    success: true,
    isPremium: user.isPremium,
    premiumExpiry: user.premiumExpiry,
    subscriptionPlan: user.subscriptionPlan,
    activeSubscription: activeSubscription
      ? {
          id: activeSubscription._id,
          plan: activeSubscription.plan,
          amount: activeSubscription.amount,
          paymentMethod: activeSubscription.paymentMethod,
          transactionId: activeSubscription.transactionId,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          status: activeSubscription.status,
        }
      : null,
  });
});

// @desc   Get subscription history
// @route  GET /api/subscription/history
// @access Private
export const getHistory = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    count: subscriptions.length,
    subscriptions,
  });
});

// @desc   Cancel subscription
// @route  POST /api/subscription/cancel
// @access Private
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: "active",
  }).sort({ createdAt: -1 });

  if (!subscription) {
    res.status(404);
    throw new Error("No active subscription found");
  }

  subscription.status = "cancelled";
  await subscription.save();

  const user = await User.findById(req.user._id);
  user.isPremium = false;
  user.premiumExpiry = null;
  user.subscriptionPlan = null;
  await user.save();

  res.json({
    success: true,
    message: "Subscription cancelled successfully",
  });
}); 