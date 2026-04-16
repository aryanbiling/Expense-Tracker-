import DashboardState from "../models/DashboardState.js";

const defaultState = (userId) => ({
  userId,
  budgetConfig: {
    monthlyBudget: 50000,
    goalTarget: 80000
  },
  friends: [],
  groups: [],
  goals: []
});

export const getDashboardState = async (req, res) => {
  let state = await DashboardState.findOne({ userId: req.userId });

  if (!state) {
    state = await DashboardState.create(defaultState(req.userId));
  }

  res.json(state);
};

export const updateDashboardState = async (req, res) => {
  const payload = {
    budgetConfig: req.body.budgetConfig,
    friends: req.body.friends,
    groups: req.body.groups,
    goals: req.body.goals
  };

  const state = await DashboardState.findOneAndUpdate(
    { userId: req.userId },
    { $set: payload, $setOnInsert: { userId: req.userId } },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(state);
};
