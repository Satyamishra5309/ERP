import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { Modal, Field, inputClass, Badge, IconButton } from "../components/ui.jsx";

const emptyItem = {
  sku: "",
  name: "",
  category: "",
  unit: "pcs",
  currentStock: 0,
  reorderLevel: 0,
  unitPrice: 0,
  warehouseLocation: "",
  isMachine: false,
};

export default function Inventory() {
  const { activeCompany } = useCompany();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding, id = editing
  const [form, setForm] = useState(emptyItem);
  const [activeItem, setActiveItem] = useState(null); // for stock movement / history modal
  const [history, setHistory] = useState([]);
  const [txnForm, setTxnForm] = useState({ type: "in", quantity: "", reference: "", damageReason: "", damageSeverity: "minor", notes: "" });
  const [search, setSearch] = useState("");

  const loadItems = () => {
    if (!activeCompany) return;
    setLoading(true);
    api
      .get("/inventory/items", { params: { search } })
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(loadItems, [activeCompany]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyItem);
    setShowForm(true);
  };

  const openEdit = (item, e) => {
    e.stopPropagation();
    setEditingId(item._id);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category || "",
      unit: item.unit,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      warehouseLocation: item.warehouseLocation || "",
      isMachine: item.isMachine,
    });
    setShowForm(true);
  };

  const removeItem = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await api.delete(`/inventory/items/${item._id}`);
    loadItems();
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/inventory/items/${editingId}`, form);
    } else {
      await api.post("/inventory/items", form);
    }
    setShowForm(false);
    setForm(emptyItem);
    setEditingId(null);
    loadItems();
  };

  const openItem = async (item) => {
    setActiveItem(item);
    setTxnForm({ type: "in", quantity: "", reference: "", damageReason: "", damageSeverity: "minor", notes: "" });
    const { data } = await api.get(`/inventory/items/${item._id}/history`);
    setHistory(data);
  };

  const submitTxn = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/inventory/transactions", {
      itemId: activeItem._id,
      type: txnForm.type,
      quantity: Number(txnForm.quantity),
      reference: txnForm.reference,
      damageReason: txnForm.type === "damage" ? txnForm.damageReason : undefined,
      damageSeverity: txnForm.type === "damage" ? txnForm.damageSeverity : undefined,
      notes: txnForm.notes,
    });
    setActiveItem(data.item);
    setHistory((h) => [data.transaction, ...h]);
    setTxnForm({ ...txnForm, quantity: "", damageReason: "", notes: "" });
    loadItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
          <p className="text-sm text-slate-400">Materials & machines for {activeCompany?.name}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add item
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className={inputClass + " max-w-xs"}
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadItems()}
        />
        <button onClick={loadItems} className="text-sm px-3 py-2 border border-surface-700 rounded-lg hover:bg-surface-800">
          Search
        </button>
      </div>

      <div className="bg-surface-900 rounded-xl border border-surface-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-950 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">No items yet. Add your first one.</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-surface-800 cursor-pointer" onClick={() => openItem(item)}>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.sku}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                <td className="px-4 py-3 text-slate-400">{item.isMachine ? "Machine" : item.category || "-"}</td>
                <td className={`px-4 py-3 ${item.currentStock <= item.reorderLevel ? "text-red-400 font-semibold" : ""}`}>
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-4 py-3"><Badge value={item.condition} /></td>
                <td className="px-4 py-3 text-slate-400">{item.warehouseLocation || "-"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <IconButton onClick={(e) => openEdit(item, e)} title="Edit item">✏️ Edit</IconButton>
                  <IconButton onClick={(e) => removeItem(item, e)} title="Delete item" danger>🗑️</IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / edit item modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit inventory item" : "Add inventory item"}>
        <form onSubmit={submitForm}>
          <Field label="SKU">
            <input className={inputClass} required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Name">
            <input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="raw_material / finished_good" />
            </Field>
            <Field label="Unit">
              <input className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={editingId ? "Current stock" : "Opening stock"}>
              <input type="number" className={inputClass} value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
            </Field>
            <Field label="Reorder level">
              <input type="number" className={inputClass} value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            </Field>
          </div>
          <Field label="Unit price">
            <input type="number" className={inputClass} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          </Field>
          <Field label="Warehouse location">
            <input className={inputClass} value={form.warehouseLocation} onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 mb-4 text-sm text-slate-300">
            <input type="checkbox" checked={form.isMachine} onChange={(e) => setForm({ ...form, isMachine: e.target.checked })} />
            This is a machine / equipment asset
          </label>
          {editingId && (
            <p className="text-xs text-amber-400 mb-3">
              Note: editing "Current stock" here directly overwrites the count without logging a movement. Use "Manage → Record stock movement" instead if you want it reflected in the item's history.
            </p>
          )}
          <button className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700">
            {editingId ? "Save changes" : "Save item"}
          </button>
        </form>
      </Modal>

      {/* Item detail: record IN/OUT/DAMAGE + full history */}
      <Modal open={!!activeItem} onClose={() => setActiveItem(null)} title={activeItem ? `${activeItem.name} (${activeItem.sku})` : ""} wide>
        {activeItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 text-sm">
              <span>Current stock: <strong>{activeItem.currentStock} {activeItem.unit}</strong></span>
              <Badge value={activeItem.condition} />
            </div>

            <form onSubmit={submitTxn} className="border border-surface-700 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-slate-200 text-sm">Record stock movement</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select className={inputClass} value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}>
                    <option value="in">Stock In</option>
                    <option value="out">Stock Out</option>
                    <option value="damage">Damage / Loss</option>
                    <option value="return">Return</option>
                    <option value="adjustment">Adjustment (set exact count)</option>
                  </select>
                </Field>
                <Field label="Quantity">
                  <input type="number" required min="0" step="any" className={inputClass} value={txnForm.quantity} onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })} />
                </Field>
              </div>
              <Field label="Reference (PO / order / work order #)">
                <input className={inputClass} value={txnForm.reference} onChange={(e) => setTxnForm({ ...txnForm, reference: e.target.value })} />
              </Field>
              {txnForm.type === "damage" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Damage reason">
                    <input className={inputClass} value={txnForm.damageReason} onChange={(e) => setTxnForm({ ...txnForm, damageReason: e.target.value })} placeholder="e.g. dropped in transit" />
                  </Field>
                  <Field label="Severity">
                    <select className={inputClass} value={txnForm.damageSeverity} onChange={(e) => setTxnForm({ ...txnForm, damageSeverity: e.target.value })}>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="total_loss">Total loss</option>
                    </select>
                  </Field>
                </div>
              )}
              <Field label="Notes">
                <input className={inputClass} value={txnForm.notes} onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })} />
              </Field>
              <button className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700">
                Record
              </button>
            </form>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-200 text-sm">Movement history</h4>
                <IconButton onClick={(e) => { setActiveItem(null); openEdit(activeItem, e); }} title="Edit item details">✏️ Edit item details</IconButton>
              </div>
              <div className="border border-surface-700 rounded-lg divide-y divide-surface-800 max-h-64 overflow-y-auto">
                {history.length === 0 && <p className="p-3 text-sm text-slate-500">No movements recorded yet.</p>}
                {history.map((h) => (
                  <div key={h._id} className="p-3 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge value={h.type} />
                      <span>Qty {h.quantity}</span>
                      {h.damageReason && <span className="text-slate-500">— {h.damageReason}</span>}
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>Stock after: {h.stockAfter}</div>
                      <div>{new Date(h.createdAt).toLocaleString()} · {h.performedBy?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
