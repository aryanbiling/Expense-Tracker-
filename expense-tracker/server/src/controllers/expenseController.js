import Expense from "../models/Expense.js";

export const listExpenses = async (req, res) => {
  const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
  res.json(expenses);
};

export const createExpense = async (req, res) => {
  const { title, amount, category, date, note } = req.body;
  if (!title || amount == null || !category || !date) {
    return res.status(400).json({ message: "Title, amount, category, and date are required" });
  }

  const expense = await Expense.create({
    userId: req.userId,
    title,
    amount,
    category,
    date,
    note
  });

  res.status(201).json(expense);
};

export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date, note } = req.body;

  const expense = await Expense.findOne({ _id: id, userId: req.userId });
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  if (title != null) expense.title = title;
  if (amount != null) expense.amount = amount;
  if (category != null) expense.category = category;
  if (date != null) expense.date = date;
  if (note != null) expense.note = note;

  await expense.save();
  res.json(expense);
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findOne({ _id: id, userId: req.userId });
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  await expense.deleteOne();
  res.json({ message: "Deleted" });
};
