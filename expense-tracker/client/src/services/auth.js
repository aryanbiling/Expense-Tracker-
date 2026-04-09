import { apiRequest } from "./api.js";

const TOKEN_KEY = "expense_token";
const USER_KEY = "expense_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const saveSession = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const registerUser = (payload) =>
  apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginUser = (payload) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
