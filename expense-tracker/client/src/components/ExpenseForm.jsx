import React, { useState } from "react";

const defaultForm = {
  title: "",
  amount: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  note: ""
};

export default function ExpenseForm({ onSubmit }) {
  const [form, setForm] = useState(defaultForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    if (!form.title || !form.amount || !form.category || !form.date) {
      return;
    }
    e.preventDefault();
    onSubmit({
      ...form,
      amount: Number(form.amount)
    });
    setForm(defaultForm);
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>
        <label>
          Amount
          <input
            name="amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Category
          <input name="category" value={form.category} onChange={handleChange} required />
        </label>
        <label>
          Date
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
        </label>
      </div>
      <label>
        Note (optional)
        <textarea name="note" value={form.note} onChange={handleChange} rows="2" />
      </label>
      <button className="primary" type="submit">Add Expense</button>
    </form>
  );
}
