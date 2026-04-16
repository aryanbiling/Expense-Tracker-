import mongoose from "mongoose";

const balanceEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    balance: { type: Number, required: true }
  },
  { _id: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    members: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    balances: { type: [balanceEntrySchema], default: [] }
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    saved: { type: Number, required: true, min: 0 },
    target: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const dashboardStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    budgetConfig: {
      monthlyBudget: { type: Number, default: 50000 },
      goalTarget: { type: Number, default: 80000 }
    },
    friends: { type: [balanceEntrySchema], default: [] },
    groups: { type: [groupSchema], default: [] },
    goals: { type: [goalSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("DashboardState", dashboardStateSchema);
