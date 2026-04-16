import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import { clearSession, getUser } from "../services/auth.js";
import { createExpense, deleteExpense, fetchExpenses } from "../services/expenses.js";
import { formatCurrency } from "../utils/currency.js";

const NavItem = ({ active, label }) => (
  <button className={`nav-item ${active ? "active" : ""}`} type="button">
    <span className="dot" />
    {label}
  </button>
);

const StatPill = ({ label, value, trend, tone }) => (
  <div className={`stat-pill ${tone}`}>
    <div>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
    <span className="trend">{trend}</span>
  </div>
);

const Insight = ({ text }) => (
  <div className="insight">
    <span className="spark" />
    <p>{text}</p>
  </div>
);

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
      topCategory: topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1])})` : "-"
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
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">ET</div>
          <div>
            <h2>Expense Tracker</h2>
            <p>Manage, split, simplify</p>
          </div>
        </div>
        <nav className="nav">
          <NavItem active label="Dashboard" />
          <NavItem label="Analytics" />
          <NavItem label="Transactions" />
          <NavItem label="Budgets" />
          <NavItem label="Goals" />
        </nav>
        <div className="sidebar-card">
          <p>Welcome back,</p>
          <h3>{user?.name || "there"}</h3>
          <button className="primary" type="button">Add Group</button>
        </div>
        <button className="ghost" onClick={handleLogout}>Log out</button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Track, plan, and stay in control.</p>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <input placeholder="Search transactions" />
            </div>
            <button className="icon">🔔</button>
            <div className="avatar">{user?.name?.[0] || "U"}</div>
          </div>
        </header>

        <section className="stat-grid">
          <StatPill label="This month" value={formatCurrency(totals.total)} trend="+4.2%" tone="purple" />
          <StatPill label="Last 7 days" value={formatCurrency(totals.weekly)} trend="-1.3%" tone="teal" />
          <StatPill label="Top category" value={totals.topCategory} trend="Food" tone="amber" />
          <div className="hero-card">
            <h4>Savings goal</h4>
            <p>Europe trip</p>
            <div className="progress">
              <div style={{ width: "56%" }} />
            </div>
            <span>56% complete</span>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header">
              <div>
                <h2>Add an expense</h2>
                <p>Keep entries clean so you can spot trends later.</p>
              </div>
            </div>
            <ExpenseForm onSubmit={handleAdd} />
          </div>

          <div className="panel insights">
            <h3>Smart insights</h3>
            <Insight text="Dining spend is 12% higher than last month." />
            <Insight text="You can save $120 by reducing subscriptions." />
            <Insight text="Weekend spend peaks on Saturdays." />
          </div>
        </section>

        <section className="content-grid">
          <div className="panel wide">
            <div className="panel-header">
              <div>
                <h2>Recent expenses</h2>
                <p>Your latest activity appears here.</p>
              </div>
              {loading ? <span className="muted">Loading...</span> : null}
            </div>
            {error ? <div className="error">{error}</div> : null}
            <ExpenseList items={expenses} onDelete={handleDelete} />
          </div>

          <div className="panel friends">
            <h3>Friends list</h3>
            <div className="friend">
              <div className="avatar small">A</div>
              <div>
                <p>Ankit</p>
                <span>Owes you {formatCurrency(120)}</span>
              </div>
              <strong className="pos">+{formatCurrency(120)}</strong>
            </div>
            <div className="friend">
              <div className="avatar small">P</div>
              <div>
                <p>Priya</p>
                <span>You owe {formatCurrency(80)}</span>
              </div>
              <strong className="neg">-{formatCurrency(80)}</strong>
            </div>
            <div className="friend">
              <div className="avatar small">S</div>
              <div>
                <p>Sahil</p>
                <span>Owes you {formatCurrency(45)}</span>
              </div>
              <strong className="pos">+{formatCurrency(45)}</strong>
            </div>
            <button className="primary" type="button">Add Friend</button>
          </div>
        </section>
      </main>
    </div>
  );
}
