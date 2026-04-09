import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import StatCard from "../components/StatCard.jsx";
import { clearSession, getUser } from "../services/auth.js";
import { createExpense, deleteExpense, fetchExpenses } from "../services/expenses.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const totals = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const monthExpenses = expenses.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const total = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
    const last7 = expenses.filter((item) => {
      const date = new Date(item.date);
      const diff = Date.now() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
    const weekly = last7.reduce((sum, item) => sum + item.amount, 0);

    const categories = monthExpenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      weekly,
      topCategory: topCategory ? `${topCategory[0]} ($${topCategory[1].toFixed(2)})` : "-"
    };
  }, [expenses]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAdd = async (payload) => {
    setError("");
    try {
      const newExpense = await createExpense(payload);
      setExpenses((prev) => [newExpense, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to create expense");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete expense");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/auth");
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <h1>Hello {user?.name || "there"}</h1>
          <p>Track, plan, and stay in control.</p>
        </div>
        <button className="ghost" onClick={handleLogout}>Log out</button>
      </header>

      <section className="stats">
        <StatCard label="This month" value={`$${totals.total.toFixed(2)}`} tone="accent" />
        <StatCard label="Last 7 days" value={`$${totals.weekly.toFixed(2)}`} tone="soft" />
        <StatCard label="Top category" value={totals.topCategory} tone="neutral" />
      </section>

      <section className="panel">
        <div>
          <h2>Add an expense</h2>
          <p>Keep entries clean so you can spot trends later.</p>
        </div>
        <ExpenseForm onSubmit={handleAdd} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent expenses</h2>
            <p>Your latest activity appears here.</p>
          </div>
          {loading ? <span className="muted">Loading...</span> : null}
        </div>
        {error ? <div className="error">{error}</div> : null}
        <ExpenseList items={expenses} onDelete={handleDelete} />
      </section>
    </div>
  );
}
