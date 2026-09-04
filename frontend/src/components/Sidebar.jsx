import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/inventory", label: "Inventory", icon: "📦" },
  { to: "/clients", label: "Clients & Brokers", icon: "🤝" },
  { to: "/quotations", label: "Quotations", icon: "📄" },
  { to: "/employees", label: "Employees", icon: "🧑‍💼" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-surface-900 border-r border-surface-700 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-surface-700">
        <span className="text-xl font-bold text-brand-400">ERP Suite</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-brand-900/30 text-brand-300" : "text-slate-300 hover:bg-surface-800"
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
