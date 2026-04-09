import { apiRequest } from "./api.js";
import { getToken } from "./auth.js";

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const fetchExpenses = () =>
  apiRequest("/api/expenses", { headers: authHeader() });

export const createExpense = (payload) =>
  apiRequest("/api/expenses", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(payload)
  });

export const updateExpense = (id, payload) =>
  apiRequest(`/api/expenses/${id}`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(payload)
  });

export const deleteExpense = (id) =>
  apiRequest(`/api/expenses/${id}`, {
    method: "DELETE",
    headers: authHeader()
  });
