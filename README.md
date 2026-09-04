# ERP Suite — Multi-Company Inventory, Clients/Brokers, Quotations & Employees

A full-stack ERP scaffold:
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (cloud) via Mongoose

## What's included

| Module | Description |
|---|---|
| **Multi-company switching** | One login can belong to several companies (`User.memberships`). The frontend company switcher in the top bar sends an `x-company-id` header on every request; the backend's `resolveTenant` middleware scopes every query to that company. Each user can also hold a different role (`owner/admin/manager/staff`) per company. Owners/admins can **edit** company details and **delete** a company (owner only) straight from the switcher — deletion cascades to remove all of that company's employees, clients, quotations, inventory, and stock history, and strips the membership from every user who had access. |
| **Clients & Brokers** | `Client` model stores `type: client/broker`, a `brokerName`, and separate **billing** and **shipping** addresses (with a "same as billing" shortcut). Full edit/delete from the table. |
| **Quotations** | Built against a client, with line items, tax, and computed totals. Picking a client in the form **autofetches** that client's billing/shipping address (shown as a live preview) and broker name — no retyping. Addresses are still **snapshotted** onto the quotation at save time so a later address edit never rewrites history. Full edit/delete. |
| **Inventory + machine tracking** | `InventoryItem` holds current stock, reorder level, condition (new/good/damaged/under repair/scrapped), and an `isMachine` flag for equipment. Full edit/delete. |
| **Stock in/out/damage history** | Every movement (`in`, `out`, `damage`, `return`, `adjustment`) is written to `StockTransaction` with quantity, reference, damage reason/severity, who performed it, and the resulting stock level — a permanent audit trail per item. |
| **Employee management** | Basic HR record: designation, department, salary, status, joining date. Full edit/delete. |
| **Dashboard** | The default landing page (`/`), with KPI cards, an inventory-by-category breakdown, a stock-value bar chart, a quotation-status donut chart, and a recent-activity feed — dark-themed to match the client's reference design. |
| **Cloud-based** | Designed to run against MongoDB **Atlas**; backend is stateless and deployable to any Node host (Render, Railway, Fly.io, EC2, etc.), frontend to any static host (Vercel, Netlify, S3+CloudFront). |

## Project structure

```
erp-system/
├── backend/
│   ├── config/db.js          # MongoDB Atlas connection
│   ├── models/                # Company, User, Employee, Client, Quotation, InventoryItem, StockTransaction
│   ├── middleware/            # auth (JWT), tenant (company switch + roles), errorHandler
│   ├── controllers/
│   ├── routes/
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/axios.js       # attaches JWT + active company header
    │   ├── context/           # AuthContext, CompanyContext (switch logic)
    │   ├── components/        # Sidebar, Topbar (company switcher), shared UI
    │   └── pages/              # Login, Dashboard, Inventory, Clients, Quotations, Employees
    └── ...
```

## Setup

### 1. MongoDB Atlas
Create a free cluster at https://www.mongodb.com/cloud/atlas, add a database user, allow your IP (or `0.0.0.0/0` for dev), and copy the connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: paste your MONGO_URI, set a JWT_SECRET
npm install
npm run dev        # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

### 4. Load sample data (recommended — see the app fully populated instantly)
```bash
cd backend
npm run seed
```
This creates **two companies** (so you can test the switcher), two users, employees, clients/brokers with billing+shipping addresses, inventory items (including a machine with a damage/repair history), a full stock in/out/damage transaction log, and several quotations at different statuses.

Then log in at the frontend with:
```
Email:    owner@acmetraders.com
Password: password123
```
This account has access to **both** "Acme Traders Pvt Ltd" and "BlueWave Exports" — use the company switcher (top-left pill) to jump between them and watch every page (Inventory, Clients, Quotations, Employees, Dashboard) re-scope automatically.

A second login, `manager@acmetraders.com` / `password123`, only belongs to Acme Traders with the `manager` role, useful for testing role-based access.

### 5. Or start from scratch manually
1. Open the frontend, click **"New here? Create an account"** — this creates your user **and** your first company (you become `owner`).
2. To manage a second company under the same login, call `POST /api/auth/companies` (a simple "Add company" UI can be wired to this endpoint next).
3. Use the company switcher (top-left pill) to jump between companies — every list (inventory, clients, quotations, employees) automatically scopes to whichever company is active.
4. In **Inventory**, add an item, then click it to record **Stock In / Out / Damage** — each entry appends to that item's permanent history log.
5. In **Clients & Brokers**, add a client with billing + shipping addresses (or a broker).
6. In **Quotations**, create a quote against a client — the billing/shipping address is captured automatically.

## Notes / next steps
- Passwords are hashed with bcrypt; auth uses JWT (7-day expiry by default).
- All company-scoped collections carry a `company` field and compound indexes, so this is ready to scale to many tenants.
- UI now uses a dark theme (see `frontend/tailwind.config.js` — `brand` and `surface` color scales) with recharts-powered visuals on the Dashboard.
- This scaffold does not yet include: PDF export of quotations, file uploads (e.g. employee documents, damage photos), email notifications, or a UI for inviting other users into a company — all straightforward additions on top of the existing models/routes.
- Because this environment has no live network access, dependencies were **not** installed here — run `npm install` in both folders as shown above (the frontend now also pulls in `recharts` for the dashboard charts).
