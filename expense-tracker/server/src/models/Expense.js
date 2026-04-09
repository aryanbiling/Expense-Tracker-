import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
