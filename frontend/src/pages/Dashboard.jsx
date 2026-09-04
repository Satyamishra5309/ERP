import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../api/axios.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { Card, Badge } from "../components/ui.jsx";

const CATEGORY_COLORS = ["#6c63f0", "#22c55e", "#f59e0b", "#0ea5e9", "#ef4444", "#a855f7"];

export default function Dashboard() {
  const { activeCompany } = useCompany();
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCompany) return;
    setLoading(true);
    Promise.all([
      api.get("/inventory/items"),
      api.get("/clients"),
      api.get("/quotations"),
      api.get("/employees"),
      api.get("/inventory/transactions?limit=10"),
    ])
      .then(([i, c, q, e, t]) => {
        setItems(i.data);
        setClients(c.data);
        setQuotations(q.data);
        setEmployees(e.data);
        setTransactions(t.data);
      })
      .finally(() => setLoading(false));
  }, [activeCompany]);

  const lowStock = items.filter((i) => i.currentStock <= i.reorderLevel);
  const damaged = items.filter((i) => i.condition === "damaged" || i.condition === "scrapped");
  const inProgressQuotes = quotations.filter((q) => ["draft", "sent"].includes(q.status));
  const acceptedQuotes = quotations.filter((q) => q.status === "accepted");
  const conversionRate = quotations.length ? Math.round((acceptedQuotes.length / quotations.length) * 100) : 0;
  const activeEmployees = employees.filter((e) => e.status === "active");

  // Stock value per category, for the horizontal bar chart
  const categoryData = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      const key = it.isMachine ? "machinery" : it.category || "uncategorized";
      map[key] = (map[key] || 0) + it.currentStock * (it.unitPrice || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  // Quotation status breakdown, for the donut chart
  const statusData = useMemo(() => {
    const order = ["draft", "sent", "accepted", "rejected", "expired"];
    return order
      .map((status) => ({ name: status, value: quotations.filter((q) => q.status === status).length }))
      .filter((d) => d.value > 0);
  }, [quotations]);

  // Per-category inventory table, mirroring a "process status" style table
  const categoryTable = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      const key = it.isMachine ? "Machinery" : (it.category || "Uncategorized").replace(/_/g, " ");
      if (!map[key]) map[key] = { name: key, items: 0, inStock: 0, lowStock: 0, damaged: 0 };
      map[key].items += 1;
      if (it.currentStock > it.reorderLevel) map[key].inStock += 1;
      if (it.currentStock <= it.reorderLevel) map[key].lowStock += 1;
      if (it.condition === "damaged" || it.condition === "scrapped") map[key].damaged += 1;
    });
    return Object.values(map);
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400">Monitor {activeCompany?.name || "your company"} in real time</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-slate-300">
          📅 Today
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Inventory Items" value={items.length} sub="in stock system" icon="📦" accent="brand" />
        <Card title="Open Quotations" value={inProgressQuotes.length} sub="draft + sent" icon="📄" accent="sky" />
        <Card title="Accepted" value={acceptedQuotes.length} sub={`${conversionRate}% conversion`} icon="✅" accent="emerald" />
        <Card title="Low Stock" value={lowStock.length} sub={`${damaged.length} damaged/scrapped`} icon="⚠️" accent="amber" />
        <Card title="Active Employees" value={activeEmployees.length} sub={`${clients.length} clients & brokers`} icon="🧑‍💼" accent="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inventory-by-category table */}
        <div className="lg:col-span-3 bg-surface-900 rounded-xl border border-surface-700">
          <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Inventory by Category</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-800 text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">In Stock</th>
                  <th className="px-4 py-3">Low Stock</th>
                  <th className="px-4 py-3">Damaged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                )}
                {!loading && categoryTable.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No inventory yet.</td></tr>
                )}
                {categoryTable.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-3 font-medium text-slate-200 capitalize">{row.name}</td>
                    <td className="px-4 py-3 text-slate-300">{row.items}</td>
                    <td className="px-4 py-3 text-emerald-400">{row.inStock}</td>
                    <td className="px-4 py-3 text-amber-400">{row.lowStock}</td>
                    <td className="px-4 py-3 text-red-400">{row.damaged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock value by category - horizontal bar chart */}
        <div className="lg:col-span-2 bg-surface-900 rounded-xl border border-surface-700 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Stock Value by Category</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262a3c" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#262a3c" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={90}
                  stroke="#262a3c"
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <Tooltip
                  contentStyle={{ background: "#12141f", border: "1px solid #262a3c", borderRadius: 8, color: "#e2e8f0" }}
                  formatter={(v) => [v.toLocaleString(), "Stock value"]}
                />
                <Bar dataKey="value" fill="#6c63f0" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-3 bg-surface-900 rounded-xl border border-surface-700">
          <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-100">Recent Stock Activity</h2>
          </div>
          <div className="divide-y divide-surface-800">
            {loading && <p className="p-5 text-sm text-slate-500">Loading...</p>}
            {!loading && transactions.length === 0 && (
              <p className="p-5 text-sm text-slate-500">No stock movements recorded yet.</p>
            )}
            {transactions.map((t) => (
              <div key={t._id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Badge value={t.type} />
                  <span className="font-medium text-slate-200">{t.item?.name}</span>
                  <span className="text-slate-500">({t.item?.sku})</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Qty: {t.quantity}</span>
                  <span className="hidden sm:inline">{t.performedBy?.name}</span>
                  <span className="hidden md:inline">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation status donut */}
        <div className="lg:col-span-2 bg-surface-900 rounded-xl border border-surface-700 p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Quotation Status</h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-slate-500">No quotations yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {statusData.map((entry, idx) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#12141f", border: "1px solid #262a3c", borderRadius: 8, color: "#e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm">
                {statusData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                    <span className="capitalize text-slate-300">{entry.name}</span>
                    <span className="text-slate-500">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
