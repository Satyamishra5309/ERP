import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { Modal, Field, inputClass, Badge, IconButton } from "../components/ui.jsx";

const emptyLine = { description: "", quantity: 1, unit: "pcs", unitPrice: 0, taxPercent: 0 };
const emptyForm = {
  quotationNumber: "",
  client: "",
  brokerName: "",
  validUntil: "",
  items: [{ ...emptyLine }],
};

function AddressPreview({ label, address }) {
  if (!address || (!address.line1 && !address.city)) {
    return (
      <div className="border border-surface-700 rounded-lg p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        No address on file for this client yet.
      </div>
    );
  }
  return (
    <div className="border border-surface-700 rounded-lg p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-400 mb-1">{label}</p>
      <p>{[address.line1, address.line2].filter(Boolean).join(", ")}</p>
      <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
      <p>{address.country}</p>
    </div>
  );
}

export default function Quotations() {
  const { activeCompany } = useCompany();
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewQuote, setViewQuote] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    if (!activeCompany) return;
    setLoading(true);
    Promise.all([api.get("/quotations"), api.get("/clients")])
      .then(([q, c]) => {
        setQuotations(q.data);
        setClients(c.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [activeCompany]);

  // The client currently picked in the form — this drives the autofetched
  // billing/shipping address preview and broker auto-fill below.
  const selectedClient = useMemo(
    () => clients.find((c) => c._id === form.client) || null,
    [clients, form.client]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (q) => {
    setEditingId(q._id);
    setForm({
      quotationNumber: q.quotationNumber,
      client: typeof q.client === "object" ? q.client._id : q.client,
      brokerName: q.brokerName || "",
      validUntil: q.validUntil ? q.validUntil.slice(0, 10) : "",
      items: q.items?.length ? q.items.map((it) => ({ ...it })) : [{ ...emptyLine }],
    });
    setShowForm(true);
  };

  const removeQuote = async (q) => {
    if (!window.confirm(`Delete quotation "${q.quotationNumber}"? This cannot be undone.`)) return;
    await api.delete(`/quotations/${q._id}`);
    load();
  };

  // When the client dropdown changes, auto-fill the broker name from that
  // client's record (unless the user already typed a custom broker name).
  const selectClient = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    setForm({
      ...form,
      client: clientId,
      brokerName: client?.brokerName || form.brokerName,
    });
  };

  const updateLine = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const addLine = () => setForm({ ...form, items: [...form.items, { ...emptyLine }] });
  const removeLine = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: form.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        taxPercent: Number(it.taxPercent),
      })),
    };
    if (editingId) {
      await api.put(`/quotations/${editingId}`, payload);
    } else {
      await api.post("/quotations", payload);
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const setStatus = async (id, status) => {
    await api.patch(`/quotations/${id}/status`, { status });
    load();
    setViewQuote((v) => (v && v._id === id ? { ...v, status } : v));
  };

  const estTotal = form.items.reduce((sum, it) => {
    const base = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    return sum + base + (base * (Number(it.taxPercent) || 0)) / 100;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quotations</h1>
          <p className="text-sm text-slate-400">Client quotes with billing & shipping details</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + New quotation
        </button>
      </div>

      <div className="bg-surface-900 rounded-xl border border-surface-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-950 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Broker</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
            {!loading && quotations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No quotations yet.</td></tr>
            )}
            {quotations.map((q) => (
              <tr key={q._id} className="hover:bg-surface-800 cursor-pointer" onClick={() => setViewQuote(q)}>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{q.quotationNumber}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{q.clientName}</td>
                <td className="px-4 py-3 text-slate-400">{q.brokerName || "-"}</td>
                <td className="px-4 py-3 text-slate-200">{q.grandTotal?.toFixed(2)}</td>
                <td className="px-4 py-3"><Badge value={q.status} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <IconButton onClick={() => openEdit(q)} title="Edit">✏️ Edit</IconButton>
                  <IconButton onClick={() => removeQuote(q)} title="Delete" danger>🗑️</IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / edit quotation */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit quotation" : "New quotation"} wide>
        <form onSubmit={submit}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quotation #">
              <input className={inputClass} required value={form.quotationNumber} onChange={(e) => setForm({ ...form, quotationNumber: e.target.value })} placeholder="QT-0001" />
            </Field>
            <Field label="Client">
              <select className={inputClass} required value={form.client} onChange={(e) => selectClient(e.target.value)}>
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Valid until">
              <input type="date" className={inputClass} value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </Field>
          </div>
          <Field label="Broker name (auto-filled from client, editable)">
            <input className={inputClass} value={form.brokerName} onChange={(e) => setForm({ ...form, brokerName: e.target.value })} />
          </Field>

          {/* Autofetched billing/shipping preview as soon as a client is picked */}
          {selectedClient && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <AddressPreview label="Billing address (from client record)" address={selectedClient.billingAddress} />
              <AddressPreview label="Shipping address (from client record)" address={selectedClient.shippingAddress} />
            </div>
          )}

          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-300">Line items</h4>
              <button type="button" onClick={addLine} className="text-xs text-brand-400 font-medium">+ Add line</button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className={inputClass + " col-span-4"} placeholder="Description" value={it.description} onChange={(e) => updateLine(idx, "description", e.target.value)} required />
                  <input type="number" className={inputClass + " col-span-2"} placeholder="Qty" value={it.quantity} onChange={(e) => updateLine(idx, "quantity", e.target.value)} required />
                  <input className={inputClass + " col-span-2"} placeholder="Unit" value={it.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)} />
                  <input type="number" className={inputClass + " col-span-2"} placeholder="Price" value={it.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", e.target.value)} required />
                  <input type="number" className={inputClass + " col-span-1"} placeholder="Tax %" value={it.taxPercent} onChange={(e) => updateLine(idx, "taxPercent", e.target.value)} />
                  <button type="button" onClick={() => removeLine(idx)} className="col-span-1 text-red-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 border-t border-surface-700 pt-3">
            <span className="text-sm text-slate-400">Estimated total</span>
            <span className="text-lg font-bold text-slate-100">{estTotal.toFixed(2)}</span>
          </div>

          <button className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 mt-4">
            {editingId ? "Save changes" : "Create quotation"}
          </button>
        </form>
      </Modal>

      {/* View quotation with billing/shipping address */}
      <Modal open={!!viewQuote} onClose={() => setViewQuote(null)} title={viewQuote?.quotationNumber} wide>
        {viewQuote && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">{viewQuote.clientName}</p>
                {viewQuote.brokerName && <p className="text-sm text-slate-400">Broker: {viewQuote.brokerName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge value={viewQuote.status} />
                <select
                  className="text-xs bg-surface-800 border border-surface-700 text-slate-200 rounded-lg px-2 py-1"
                  value={viewQuote.status}
                  onChange={(e) => setStatus(viewQuote._id, e.target.value)}
                >
                  {["draft", "sent", "accepted", "rejected", "expired"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <AddressPreview label="BILLING ADDRESS" address={viewQuote.billingAddress} />
              <AddressPreview label="SHIPPING ADDRESS" address={viewQuote.shippingAddress} />
            </div>

            <table className="w-full text-sm border border-surface-700 rounded-lg overflow-hidden">
              <thead className="bg-surface-800 text-slate-400 text-left">
                <tr>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Tax %</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {viewQuote.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-slate-200">{it.description}</td>
                    <td className="px-3 py-2 text-slate-300">{it.quantity} {it.unit}</td>
                    <td className="px-3 py-2 text-slate-300">{it.unitPrice}</td>
                    <td className="px-3 py-2 text-slate-300">{it.taxPercent}%</td>
                    <td className="px-3 py-2 text-slate-200">{it.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-56 text-sm space-y-1">
                <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{viewQuote.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Tax</span><span>{viewQuote.taxTotal?.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-slate-100 border-t border-surface-700 pt-1"><span>Grand total</span><span>{viewQuote.grandTotal?.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="flex justify-end">
              <IconButton onClick={() => { setViewQuote(null); openEdit(viewQuote); }}>✏️ Edit this quotation</IconButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
