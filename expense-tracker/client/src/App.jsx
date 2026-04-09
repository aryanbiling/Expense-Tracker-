import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getToken } from "./services/auth.js";

const PrivateRoute = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const token = getToken();
  return token ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
