import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, saveSession } from "../services/auth.js";
import { formatCurrency } from "../utils/currency.js";

export default function AuthPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };
      const data = isRegister ? await registerUser(payload) : await loginUser(payload);
      saveSession(data);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <p className="pill">Expense Tracker</p>
        <h1>Track your money with calm and clarity.</h1>
        <p className="subtitle">
          A clean dashboard for your daily spend. Simple, focused, and easy to use.
        </p>
        <div className="hero-card">
          <div>
            <p>Monthly Spend</p>
            <h3>{formatCurrency(1842.5)}</h3>
          </div>
          <div>
            <p>Top Category</p>
            <h3>Groceries</h3>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <h2>{isRegister ? "Create account" : "Welcome back"}</h2>
        <p>{isRegister ? "Start in under a minute." : "Log in to keep tracking."}</p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          {error ? <div className="error">{error}</div> : null}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>
        </form>
        <button className="link" onClick={() => setIsRegister((prev) => !prev)}>
          {isRegister ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
