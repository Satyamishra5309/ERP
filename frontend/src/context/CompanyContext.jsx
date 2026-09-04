import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);

  const loadCompanies = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get("/companies");
    setCompanies(data);

    const storedId = localStorage.getItem("activeCompanyId");
    const match = data.find((c) => c._id === storedId) || data[0];
    if (match) {
      localStorage.setItem("activeCompanyId", match._id);
      setActiveCompany(match);
    }
  }, [user]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Switching companies just updates the stored id + axios header context;
  // every list/detail page re-fetches automatically because it reads activeCompany.
  // We don't require the company to already be in the in-memory `companies` list
  // here (e.g. right after creating a brand new one) — the page reload below
  // re-fetches the company list fresh and picks it up.
  const switchCompany = (companyId) => {
    localStorage.setItem("activeCompanyId", companyId);
    window.location.reload(); // simplest way to force all data to refresh for the new tenant
  };

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, switchCompany, reloadCompanies: loadCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
