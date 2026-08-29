import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Settings from "../models/Settings.js";
import { awardPoints } from "./rewardController.js";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY); 

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

// @desc   Create Stripe checkout session
// @route  POST /api/subscription/create-checkout
// @access Private (user only)
export const createCheckout = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!plan || !["monthly", "yearly"].includes(plan)) {
    res.status(400);
    throw new Error("Plan must be 'monthly' or 'yearly'");
  }

  const user = await User.findById(req.user._id);
  if (user.isPremium && user.premiumExpiry && user.premiumExpiry > new Date()) {
    res.status(400);
    throw new Error(
      `You already have an active premium subscription until ${user.premiumExpiry.toLocaleDateString()}`
    );
  }

  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) settings = await Settings.create({ key: "platform" });

  const amount = plan === "monthly" ? settings.monthlyPrice : settings.yearlyPrice;

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email, 
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Ki Khabo Premium — ${plan === "monthly" ? "Monthly" : "Yearly"}`,
            description: `${plan === "monthly" ? "1 month" : "1 year"} of premium access`,
          },
          unit_amount: amount * 100, // Stripe uses smallest currency unit (paisa)
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: req.user._id.toString(),
      plan,
      amount: amount.toString(),
    },
    success_url: `${process.env.CLIENT_URL}/app/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/app/subscription?cancelled=true`,
  });

  res.json({
    success: true,
    checkoutUrl: session.url,
    sessionId: session.id,
  });
});

// @desc   Verify Stripe session and activate premium
// @route  POST /api/subscription/verify
// @access Private
export const verifyCheckout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400);
    throw new Error("Session ID is required");
  }

  // Check if this session was already used
  const existingSub = await Subscription.findOne({ transactionId: sessionId });
  if (existingSub) {
    return res.json({
      success: true,
      message: "Subscription already activated",
      subscription: existingSub,
    });
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    res.status(400);
    throw new Error("Payment not completed");
  }

  const { userId, plan, amount } = session.metadata;

  if (userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Session does not belong to this user");
  }

  // Calculate dates
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
    amount: parseInt(amount),
    paymentMethod: "stripe",
    transactionId: sessionId,
    status: "active",
    startDate,
    endDate,
  });

  // Activate premium
  const user = await User.findById(req.user._id);
  user.isPremium = true;
  user.premiumExpiry = endDate;
  user.subscriptionPlan = plan;
  await user.save();

  // Award points
  await awardPoints(
    req.user._id,
    "subscription_purchased",
    `${plan} premium subscription activated via Stripe`,
    subscription._id
  );

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