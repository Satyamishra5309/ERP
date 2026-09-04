import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { Modal, Field, inputClass, IconButton } from "../components/ui.jsx";

const emptyAddress = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };
const emptyClient = {
  type: "client",
  name: "",
  brokerName: "",
  contactPerson: "",
  email: "",
  phone: "",
  gstin: "",
  billingAddress: { ...emptyAddress },
  shippingAddress: { ...emptyAddress },
  sameAsBilling: false,
};

function AddressFields({ label, value, onChange }) {
  return (
    <fieldset className="border border-surface-700 rounded-lg p-3 mb-3">
      <legend className="text-xs font-semibold text-slate-400 px-1">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Address line 1" value={value.line1} onChange={(e) => onChange({ ...value, line1: e.target.value })} />
        <input className={inputClass} placeholder="Address line 2" value={value.line2} onChange={(e) => onChange({ ...value, line2: e.target.value })} />
        <input className={inputClass} placeholder="City" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
        <input className={inputClass} placeholder="State" value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} />
        <input className={inputClass} placeholder="Postal code" value={value.postalCode} onChange={(e) => onChange({ ...value, postalCode: e.target.value })} />
        <input className={inputClass} placeholder="Country" value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </div>
    </fieldset>
  );
}

export default function Clients() {
  const { activeCompany } = useCompany();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [filterType, setFilterType] = useState("");

  const load = () => {
    if (!activeCompany) return;
    setLoading(true);
    api
      .get("/clients", { params: filterType ? { type: filterType } : {} })
      .then((res) => setClients(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeCompany, filterType]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyClient);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      type: c.type,
      name: c.name,
      brokerName: c.brokerName || "",
      contactPerson: c.contactPerson || "",
      email: c.email || "",
      phone: c.phone || "",
      gstin: c.gstin || "",
      billingAddress: { ...emptyAddress, ...c.billingAddress },
      shippingAddress: { ...emptyAddress, ...c.shippingAddress },
      sameAsBilling: !!c.sameAsBilling,
    });
    setShowForm(true);
  };

  const removeClient = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    await api.delete(`/clients/${c._id}`);
    load();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/clients/${editingId}`, form);
    } else {
      await api.post("/clients", form);
    }
    setShowForm(false);
    setForm(emptyClient);
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Clients & Brokers</h1>
          <p className="text-sm text-slate-400">Manage buyers, sellers, and brokers for {activeCompany?.name}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add client / broker
        </button>
      </div>

      <div className="flex gap-2">
        {["", "client", "broker"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filterType === t ? "bg-brand-900/30 border-brand-700 text-brand-300" : "border-surface-700 text-slate-300 hover:bg-surface-800"}`}
          >
            {t === "" ? "All" : t === "client" ? "Clients" : "Brokers"}
          </button>
        ))}
      </div>

      <div className="bg-surface-900 rounded-xl border border-surface-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-950 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Billing city</th>
              <th className="px-4 py-3">Shipping city</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No clients yet.</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c._id} className="hover:bg-surface-800">
                <td className="px-4 py-3 font-medium text-slate-200">{c.name}</td>
                <td className="px-4 py-3 capitalize text-slate-400">{c.type}</td>
                <td className="px-4 py-3 text-slate-400">{c.brokerName || "-"}</td>
                <td className="px-4 py-3 text-slate-400">{c.phone || c.email || "-"}</td>
                <td className="px-4 py-3 text-slate-400">{c.billingAddress?.city || "-"}</td>
                <td className="px-4 py-3 text-slate-400">{c.shippingAddress?.city || "-"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <IconButton onClick={() => openEdit(c)} title="Edit">✏️ Edit</IconButton>
                  <IconButton onClick={() => removeClient(c)} title="Delete" danger>🗑️</IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit client / broker" : "Add client / broker"} wide>
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="client">Client</option>
                <option value="broker">Broker</option>
              </select>
            </Field>
            <Field label="Name">
              <input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Broker name (if applicable)">
              <input className={inputClass} value={form.brokerName} onChange={(e) => setForm({ ...form, brokerName: e.target.value })} />
            </Field>
            <Field label="Contact person">
              <input className={inputClass} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>

          <AddressFields
            label="Billing address"
            value={form.billingAddress}
            onChange={(addr) => setForm({ ...form, billingAddress: addr, shippingAddress: form.sameAsBilling ? addr : form.shippingAddress })}
          />

          <label className="flex items-center gap-2 mb-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.sameAsBilling}
              onChange={(e) =>
                setForm({
                  ...form,
                  sameAsBilling: e.target.checked,
                  shippingAddress: e.target.checked ? form.billingAddress : form.shippingAddress,
                })
              }
            />
            Shipping address same as billing
          </label>

          {!form.sameAsBilling && (
            <AddressFields
              label="Shipping address"
              value={form.shippingAddress}
              onChange={(addr) => setForm({ ...form, shippingAddress: addr })}
            />
          )}

          <button className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 mt-2">
            {editingId ? "Save changes" : "Save"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
