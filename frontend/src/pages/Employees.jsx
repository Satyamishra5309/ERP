import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { Modal, Field, inputClass, Badge, IconButton } from "../components/ui.jsx";

const empty = {
  employeeId: "",
  name: "",
  designation: "",
  department: "",
  email: "",
  phone: "",
  dateOfJoining: "",
  salary: "",
  status: "active",
  address: "",
};

export default function Employees() {
  const { activeCompany } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    if (!activeCompany) return;
    setLoading(true);
    api.get("/employees").then((res) => setEmployees(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [activeCompany]);

  const openAdd = () => {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setForm({
      employeeId: emp.employeeId,
      name: emp.name,
      designation: emp.designation || "",
      department: emp.department || "",
      email: emp.email || "",
      phone: emp.phone || "",
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : "",
      salary: emp.salary || "",
      status: emp.status,
      address: emp.address || "",
    });
    setShowForm(true);
  };

  const removeEmployee = async (emp) => {
    if (!window.confirm(`Delete "${emp.name}"? This cannot be undone.`)) return;
    await api.delete(`/employees/${emp._id}`);
    load();
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, salary: Number(form.salary) || 0 };
    if (editingId) {
      await api.put(`/employees/${editingId}`, payload);
    } else {
      await api.post("/employees", payload);
    }
    setShowForm(false);
    setForm(empty);
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Employees</h1>
          <p className="text-sm text-slate-400">Team roster for {activeCompany?.name}</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add employee
        </button>
      </div>

      <div className="bg-surface-900 rounded-xl border border-surface-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-950 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>}
            {!loading && employees.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No employees yet.</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-surface-800">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{emp.employeeId}</td>
                <td className="px-4 py-3 font-medium text-slate-200">{emp.name}</td>
                <td className="px-4 py-3 text-slate-400">{emp.designation || "-"}</td>
                <td className="px-4 py-3 text-slate-400">{emp.department || "-"}</td>
                <td className="px-4 py-3"><Badge value={emp.status} /></td>
                <td className="px-4 py-3 text-slate-400">{emp.phone || emp.email || "-"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <IconButton onClick={() => openEdit(emp)} title="Edit">✏️ Edit</IconButton>
                  <IconButton onClick={() => removeEmployee(emp)} title="Delete" danger>🗑️</IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? "Edit employee" : "Add employee"}>
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID">
              <input className={inputClass} required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP-001" />
            </Field>
            <Field label="Name">
              <input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation">
              <input className={inputClass} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </Field>
            <Field label="Department">
              <input className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of joining">
              <input type="date" className={inputClass} value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            </Field>
            <Field label="Salary">
              <input type="number" className={inputClass} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </Field>
          </div>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </Field>
          <Field label="Address">
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <button className="w-full bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 mt-2">
            {editingId ? "Save changes" : "Save employee"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
