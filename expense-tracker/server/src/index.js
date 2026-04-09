import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });
