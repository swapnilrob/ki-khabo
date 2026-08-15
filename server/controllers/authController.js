import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import { generateToken } from "../utils/generateToken.js";
import { DIETARY_PREFERENCES, ALLERGENS } from "../constants/dietaryOptions.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  location: user.location,
  isPremium: user.isPremium,
  rewardPoints: user.rewardPoints,
  dietaryPreferences: user.dietaryPreferences,
  allergies: user.allergies,
});

// @desc   Register a regular user (food seeker)
// @route  POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("Name, email, phone and password are all required");
  }

  if (await User.findOne({ email })) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, phone, password, role: "user" });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  });
});

// @desc   Register a restaurant owner + create their pending restaurant
// @route  POST /api/auth/register-owner
// @access Public
export const registerOwner = asyncHandler(async (req, res) => {
  const {
    name, email, phone, password,
    businessName, tradeLicenseNo, cuisineTypes, priceRange,
    address, city, restaurantPhone, openingHours, latitude, longitude,
  } = req.body;

  if (!name || !email || !phone || !password || !businessName ||
      !tradeLicenseNo || !address || !city) {
    res.status(400);
    throw new Error("Please complete all required fields in every step");
  }

  if (await User.findOne({ email })) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }
  if (await Restaurant.findOne({ tradeLicenseNo })) {
    res.status(409);
    throw new Error("This trade license number is already registered");
  }

  const owner = await User.create({ name, email, phone, password, role: "owner" });

  try {
    const restaurant = await Restaurant.create({
      owner: owner._id,
      businessName,
      tradeLicenseNo,
      phone: restaurantPhone || phone,
      address,
      city,
      cuisineTypes: cuisineTypes || [],
      priceRange: priceRange || "$$",
      openingHours: openingHours || "",
      location: {
        type: "Point",
        coordinates: [Number(longitude) || 0, Number(latitude) || 0],
      },
      status: "pending",
    });

    // TODO (Swapnil, M3-5): email the owner "application received"

    res.status(201).json({
      success: true,
      message:
        "Registration submitted. An admin will verify your restaurant before it appears publicly.",
      token: generateToken(owner._id, owner.role),
      user: publicUser(owner),
      restaurant: {
        id: restaurant._id,
        businessName: restaurant.businessName,
        status: restaurant.status,
      },
    });
  } catch (error) {
    await User.findByIdAndDelete(owner._id);
    throw error;
  }
});

// @desc   Login for all roles
// @route  POST /api/auth/login
// @access Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact support.");
  }

  const payload = {
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  };

  if (user.role === "owner") {
    const restaurant = await Restaurant.findOne({ owner: user._id });
    payload.restaurant = restaurant && {
      id: restaurant._id,
      businessName: restaurant.businessName,
      status: restaurant.status,
      rejectionReason: restaurant.rejectionReason,
    };
  }

  res.json(payload);
});

// @desc   Current session (restores login on page refresh)
// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  const payload = { success: true, user: publicUser(req.user) };

  if (req.user.role === "owner") {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    payload.restaurant = restaurant && {
      id: restaurant._id,
      businessName: restaurant.businessName,
      status: restaurant.status,
      rejectionReason: restaurant.rejectionReason,
    };
  }

  res.json(payload);
});

// @desc   Update own profile
// @route  PUT /api/auth/me
// @access Private
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, location, password, dietaryPreferences, allergies } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (location !== undefined) user.location = location;
  if (password) user.password = password;

  // M1-3 — dietary preferences & allergies
  if (dietaryPreferences !== undefined) {
    const invalid = dietaryPreferences.filter((p) => !DIETARY_PREFERENCES.includes(p));
    if (invalid.length) {
      res.status(400);
      throw new Error(`Unknown dietary preference(s): ${invalid.join(", ")}`);
    }
    user.dietaryPreferences = dietaryPreferences;
  }

  if (allergies !== undefined) {
    const invalid = allergies.filter((a) => !ALLERGENS.includes(a));
    if (invalid.length) {
      res.status(400);
      throw new Error(`Unknown allergy tag(s): ${invalid.join(", ")}`);
    }
    user.allergies = allergies;
  }

  await user.save();
  res.json({ success: true, user: publicUser(user) });
});