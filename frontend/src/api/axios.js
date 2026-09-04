import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach JWT + the currently selected company on every request.
// This is what lets the same UI "switch" between companies seamlessly.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("activeCompanyId");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (companyId) config.headers["x-company-id"] = companyId;
  return config;
});

export default api;
