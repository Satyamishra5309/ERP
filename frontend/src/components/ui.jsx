export function Card({ title, value, sub, accent = "brand", icon }) {
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-700 p-5 shadow-card">
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${accent}-900/30 text-${accent}-400 text-lg`}>
            {icon}
          </div>
        )}
        <p className="text-sm text-slate-400">{title}</p>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className={`text-xs mt-1 text-${accent}-400`}>{sub}</p>}
    </div>
  );
}

const badgeColors = {
  in: "bg-emerald-900/30 text-emerald-300",
  out: "bg-amber-900/30 text-amber-300",
  damage: "bg-red-900/30 text-red-300",
  adjustment: "bg-surface-800 text-slate-200",
  return: "bg-sky-900/30 text-sky-300",
  draft: "bg-surface-800 text-slate-300",
  sent: "bg-sky-900/30 text-sky-300",
  accepted: "bg-emerald-900/30 text-emerald-300",
  rejected: "bg-red-900/30 text-red-300",
  expired: "bg-surface-800 text-slate-400",
  active: "bg-emerald-900/30 text-emerald-300",
  on_leave: "bg-amber-900/30 text-amber-300",
  terminated: "bg-red-900/30 text-red-300",
};

export function Badge({ value }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        badgeColors[value] || "bg-surface-800 text-slate-300"
      }`}
    >
      {value?.replace("_", " ")}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-surface-900 rounded-xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-slate-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full bg-surface-800 border border-surface-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export function IconButton({ onClick, children, title, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`text-xs font-medium px-2 py-1 rounded-md transition ${
        danger
          ? "text-red-400 hover:bg-red-900/30"
          : "text-brand-400 hover:bg-brand-900/30"
      }`}
    >
      {children}
    </button>
  );
}
