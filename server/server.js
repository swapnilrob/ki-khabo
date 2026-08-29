import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import discoverRoutes from "./routes/discoverRoutes.js";
import mealPlannerRoutes from "./routes/mealPlanRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import savedDishRoutes from "./routes/savedDishRoutes.js";
import foodListRoutes from "./routes/foodListRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import aiVisionRoutes from "./routes/aiVisionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Ki Khabo API" })
);

// ─── ROUTE REGISTRY ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/nutrition", nutritionRoutes);            // Mostahid (M2-1)
app.use("/api/reviews", reviewRoutes);                 // Shakib (M1-4)
app.use("/api/dishes", dishRoutes);                    // Swapnil (M1-2)
app.use("/api/discover", discoverRoutes);              // Noman (M1-1)
app.use("/api/recommendations", recommendationRoutes); // Noman (M2-2)
app.use("/api/follows", followRoutes);                 // Shakib (M2-4)
app.use("/api/saved-dishes", savedDishRoutes);         // Shakib (M2-4)
app.use("/api/food-lists", foodListRoutes);            // Shakib (M2-4)
app.use("/api/feed", feedRoutes);                      // Shakib (M2-4)
app.use("/api/orders", orderRoutes);                   // Noman (M3-4)
app.use("/api/meal-planner", mealPlannerRoutes);       // Swapnil (M2-3)
app.use("/api/analytics", analyticsRoutes);            // Swapnil (M3-3)
app.use("/api/subscription", subscriptionRoutes);      // Shakib (M3-6)
app.use("/api/rewards", rewardRoutes);                 // Shakib (M3-7)
app.use("/api/ai-assistant", aiAssistantRoutes);       // Mostahid (M3-1)
app.use("/api/ai-vision", aiVisionRoutes);             // Mostahid (M3-2)
app.use("/api/notifications", notificationRoutes);     // Swapnil (M3-5)
// ───────────────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);