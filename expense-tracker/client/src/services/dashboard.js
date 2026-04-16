import { apiRequest } from "./api.js";
import { getToken } from "./auth.js";

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const fetchDashboardState = () =>
  apiRequest("/api/dashboard", {
    headers: authHeader()
  });

export const saveDashboardState = (payload) =>
  apiRequest("/api/dashboard", {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(payload)
  });
