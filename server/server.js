import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// import authRoutes from "./routes/authRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import restaurantRoutes from "./routes/restaurantRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "Ki Khabo API" })
);

// ─── ROUTE REGISTRY ────────────────────────────────────────────────
// Each member adds exactly ONE line here for their own route file.
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/nutrition", nutritionRoutes);      // Mostahid
// app.use("/api/reviews", reviewRoutes);           // Shakib
// app.use("/api/orders", orderRoutes);             // Noman
// app.use("/api/meal-planner", mealPlannerRoutes); // Swapnil
// ───────────────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);