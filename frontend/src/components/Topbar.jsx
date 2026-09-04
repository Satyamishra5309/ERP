import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import api from "../api/axios.js";
import { Modal, Field, inputClass, IconButton } from "./ui.jsx";

const emptyAddress = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };
const emptyCompany = {
  name: "",
  legalName: "",
  gstin: "",
  phone: "",
  email: "",
  address: { ...emptyAddress },
};

function CompanyForm({ form, setForm }) {
  return (
    <>
      <Field label="Company name">
        <input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Legal name">
        <input className={inputClass} value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GSTIN / Tax ID">
          <input className={inputClass} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Email">
        <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <fieldset className="border border-surface-700 rounded-lg p-3 mb-3">
        <legend className="text-xs font-semibold text-slate-400 px-1">Address</legend>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Address line 1" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} />
          <input className={inputClass} placeholder="Address line 2" value={form.address.line2} onChange={(e) => setForm({ ...form, address: { ...form.address, line2: e.target.value } })} />
          <input className={inputClass} placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
          <input className={inputClass} placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
          <input className={inputClass} placeholder="Postal code" value={form.address.postalCode} onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })} />
          <input className={inputClass} placeholder="Country" value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
        </div>
      </fieldset>
    </>
  );
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const { companies, activeCompany, switchCompany, reloadCompanies } = useCompany();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null); // company object being edited, or null
  const [form, setForm] = useState(emptyCompany);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setOpen(false);
    setForm(emptyCompany);
    setShowAdd(true);
  };

  const openEdit = (company, e) => {
    e.stopPropagation();
    setOpen(false);
    setForm({
      name: company.name,
      legalName: company.legalName || "",
      gstin: company.gstin || "",
      phone: company.phone || "",
      email: company.email || "",
      address: { ...emptyAddress, ...company.address },
    });
    setEditingCompany(company);
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: newCompany } = await api.post("/auth/companies", form);
      setShowAdd(false);
      setForm(emptyCompany);
      // Switch straight into the newly created company (this reloads the page,
      // which re-fetches the company list fresh so the new one is included)
      switchCompany(newCompany._id);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/companies/${editingCompany._id}`, form);
      setEditingCompany(null);
      await reloadCompanies();
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (company, e) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete "${company.name}"? This permanently removes all its employees, clients, quotations, and inventory data. This cannot be undone.`
    );
    if (!confirmed) return;

    await api.delete(`/companies/${company._id}`);

    if (activeCompany?._id === company._id) {
      // We just deleted the active company — fall back to whatever is left, if anything
      const remaining = companies.filter((c) => c._id !== company._id);
      if (remaining[0]) {
        switchCompany(remaining[0]._id); // reloads the page
        return;
      }
      localStorage.removeItem("activeCompanyId");
      window.location.reload();
      return;
    }

    await reloadCompanies();
  };

  return (
    <header className="h-16 bg-surface-900 border-b border-surface-700 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-700 hover:bg-surface-800 text-sm font-medium text-slate-200"
        >
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          {activeCompany ? activeCompany.name : "Select company"}
          <span className="text-slate-500">▾</span>
        </button>

        {open && (
          <div className="absolute mt-2 w-72 bg-surface-900 border border-surface-700 rounded-lg shadow-xl py-1 z-20">
            <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Switch company
            </p>
            {companies.map((c) => (
              <div
                key={c._id}
                className={`w-full px-3 py-2 text-sm hover:bg-surface-800 flex items-center justify-between gap-2 ${
                  activeCompany?._id === c._id ? "text-brand-300" : "text-slate-200"
                }`}
              >
                <button
                  onClick={() => {
                    switchCompany(c._id);
                    setOpen(false);
                  }}
                  className="flex-1 text-left flex items-center justify-between gap-2 min-w-0"
                >
                  <span className={`truncate ${activeCompany?._id === c._id ? "font-medium" : ""}`}>{c.name}</span>
                  <span className="text-xs text-slate-500 capitalize shrink-0">{c.role}</span>
                </button>
                {["owner", "admin"].includes(c.role) && (
                  <button onClick={(e) => openEdit(c, e)} title="Edit company" className="text-slate-500 hover:text-brand-400 shrink-0">
                    ✏️
                  </button>
                )}
                {c.role === "owner" && (
                  <button onClick={(e) => deleteCompany(c, e)} title="Delete company" className="text-slate-500 hover:text-red-400 shrink-0">
                    🗑️
                  </button>
                )}
              </div>
            ))}
            {companies.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">No companies yet</p>
            )}
            <div className="border-t border-surface-800 mt-1 pt-1">
              <button
                onClick={openAdd}
                className="w-full text-left px-3 py-2 text-sm text-brand-400 font-medium hover:bg-brand-900/30 flex items-center gap-2"
              >
                <span>+</span> Add new company
              </button>
            </div>
          </div>
        )}

        {/* Add company modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add new company">
          <p className="text-sm text-slate-400 mb-4">
            You'll be added as the <strong>owner</strong> of this company and can switch to it right after saving.
          </p>
          <form onSubmit={submitAdd}>
            <CompanyForm form={form} setForm={setForm} />
            <button
              disabled={saving}
              className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create company"}
            </button>
          </form>
        </Modal>

        {/* Edit company modal */}
        <Modal open={!!editingCompany} onClose={() => setEditingCompany(null)} title={`Edit ${editingCompany?.name || "company"}`}>
          <form onSubmit={submitEdit}>
            <CompanyForm form={form} setForm={setForm} />
            <button
              disabled={saving}
              className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Modal>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-300">{user?.name}</span>
        <button
          onClick={logout}
          className="text-sm font-medium text-slate-400 hover:text-brand-400"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
