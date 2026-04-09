const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const parseJson = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return null;
};

export const apiRequest = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
};
