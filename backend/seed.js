// Sample data seeder — populates two companies so you can test the
// company-switcher, inventory history, quotations, employees, etc.
//
// Usage:
//   cd backend
//   npm install
//   cp .env.example .env   (fill in your MONGO_URI)
//   node seed.js
//
// Login after seeding with:
//   email: owner@acmetraders.com   password: password123
// You'll have access to BOTH companies below via the switcher.

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

import User from "./models/User.js";
import Company from "./models/Company.js";
import Employee from "./models/Employee.js";
import Client from "./models/Client.js";
import InventoryItem from "./models/InventoryItem.js";
import StockTransaction from "./models/StockTransaction.js";
import Quotation from "./models/Quotation.js";

dotenv.config();

const run = async () => {
  await connectDB();

  console.log("Clearing existing sample-adjacent data...");
  await Promise.all([
    User.deleteMany({ email: /@acmetraders\.com|@bluewaveexports\.com/ }),
    Company.deleteMany({ name: { $in: ["Acme Traders Pvt Ltd", "BlueWave Exports"] } }),
  ]);

  // ---------- Companies ----------
  const acme = await Company.create({
    name: "Acme Traders Pvt Ltd",
    legalName: "Acme Traders Private Limited",
    gstin: "27ACMEP1234A1Z5",
    address: {
      line1: "14 Industrial Estate Road",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411019",
      country: "India",
    },
    phone: "+91 98765 43210",
    email: "info@acmetraders.com",
  });

  const bluewave = await Company.create({
    name: "BlueWave Exports",
    legalName: "BlueWave Exports LLC",
    gstin: "29BLUEW5678B1Z2",
    address: {
      line1: "220 Harbor Drive",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India",
    },
    phone: "+91 90000 11223",
    email: "ops@bluewaveexports.com",
  });

  // ---------- Users (same person, owner of both companies) ----------
  const owner = await User.create({
    name: "Ravi Sharma",
    email: "owner@acmetraders.com",
    password: "password123",
    memberships: [
      { company: acme._id, role: "owner" },
      { company: bluewave._id, role: "admin" },
    ],
  });

  const manager = await User.create({
    name: "Priya Nair",
    email: "manager@acmetraders.com",
    password: "password123",
    memberships: [{ company: acme._id, role: "manager" }],
  });

  console.log("Users created:", owner.email, manager.email);

  // ---------- Employees (Acme) ----------
  await Employee.insertMany([
    {
      company: acme._id,
      employeeId: "EMP-001",
      name: "Priya Nair",
      designation: "Warehouse Manager",
      department: "Operations",
      email: "priya@acmetraders.com",
      phone: "+91 98111 22334",
      dateOfJoining: new Date("2022-03-14"),
      salary: 55000,
      status: "active",
      address: "Kothrud, Pune",
    },
    {
      company: acme._id,
      employeeId: "EMP-002",
      name: "Suresh Patil",
      designation: "Machine Operator",
      department: "Production",
      email: "suresh@acmetraders.com",
      phone: "+91 98222 33445",
      dateOfJoining: new Date("2023-06-01"),
      salary: 32000,
      status: "active",
      address: "Hadapsar, Pune",
    },
    {
      company: acme._id,
      employeeId: "EMP-003",
      name: "Anjali Deshmukh",
      designation: "Sales Executive",
      department: "Sales",
      email: "anjali@acmetraders.com",
      phone: "+91 98333 44556",
      dateOfJoining: new Date("2021-11-20"),
      salary: 40000,
      status: "on_leave",
      address: "Baner, Pune",
    },
  ]);

  // ---------- Employees (BlueWave) ----------
  await Employee.insertMany([
    {
      company: bluewave._id,
      employeeId: "BWE-001",
      name: "Karthik Rajan",
      designation: "Export Coordinator",
      department: "Logistics",
      email: "karthik@bluewaveexports.com",
      phone: "+91 90111 22334",
      dateOfJoining: new Date("2020-08-10"),
      salary: 48000,
      status: "active",
      address: "T Nagar, Chennai",
    },
  ]);

  console.log("Employees created");

  // ---------- Clients & Brokers (Acme) ----------
  const clientMehta = await Client.create({
    company: acme._id,
    type: "client",
    name: "Mehta Steel Industries",
    contactPerson: "Vikram Mehta",
    email: "purchase@mehtasteel.in",
    phone: "+91 99001 12233",
    gstin: "27MEHTA9988C1Z1",
    billingAddress: {
      line1: "Plot 45, MIDC Industrial Area",
      city: "Aurangabad",
      state: "Maharashtra",
      postalCode: "431136",
      country: "India",
    },
    shippingAddress: {
      line1: "Warehouse 7, Chakan Industrial Belt",
      city: "Chakan",
      state: "Maharashtra",
      postalCode: "410501",
      country: "India",
    },
  });

  const brokerGupta = await Client.create({
    company: acme._id,
    type: "broker",
    name: "Gupta Trading Agency",
    contactPerson: "Rajesh Gupta",
    email: "rajesh@guptatrading.com",
    phone: "+91 99222 33445",
    billingAddress: {
      line1: "Shop 12, Market Yard",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411037",
      country: "India",
    },
    shippingAddress: {
      line1: "Shop 12, Market Yard",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411037",
      country: "India",
    },
    sameAsBilling: true,
  });

  const clientSharma = await Client.create({
    company: acme._id,
    type: "client",
    name: "Sharma Constructions",
    brokerName: "Gupta Trading Agency",
    contactPerson: "Deepak Sharma",
    email: "deepak@sharmaconstructions.in",
    phone: "+91 99333 44556",
    billingAddress: {
      line1: "3rd Floor, Landmark Tower",
      city: "Nagpur",
      state: "Maharashtra",
      postalCode: "440001",
      country: "India",
    },
    shippingAddress: {
      line1: "Site Office, Wardha Road",
      city: "Nagpur",
      state: "Maharashtra",
      postalCode: "440025",
      country: "India",
    },
  });

  // ---------- Clients (BlueWave) ----------
  const clientOceanic = await Client.create({
    company: bluewave._id,
    type: "client",
    name: "Oceanic Imports Ltd",
    contactPerson: "James Carter",
    email: "james@oceanicimports.com",
    phone: "+1 415 555 0134",
    billingAddress: {
      line1: "500 Bay Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94111",
      country: "USA",
    },
    shippingAddress: {
      line1: "Pier 27 Warehouse",
      city: "San Francisco",
      state: "CA",
      postalCode: "94111",
      country: "USA",
    },
  });

  console.log("Clients & brokers created");

  // ---------- Inventory (Acme) ----------
  const steelRod = await InventoryItem.create({
    company: acme._id,
    sku: "RM-STL-001",
    name: "Steel Rod 12mm",
    category: "raw_material",
    unit: "kg",
    currentStock: 0,
    reorderLevel: 200,
    unitPrice: 65,
    warehouseLocation: "Rack A1",
    isMachine: false,
    condition: "good",
  });

  const cementBag = await InventoryItem.create({
    company: acme._id,
    sku: "RM-CEM-002",
    name: "Cement Bag 50kg",
    category: "raw_material",
    unit: "pcs",
    currentStock: 0,
    reorderLevel: 100,
    unitPrice: 380,
    warehouseLocation: "Rack B2",
    isMachine: false,
    condition: "good",
  });

  const lathe = await InventoryItem.create({
    company: acme._id,
    sku: "MC-LTH-010",
    name: "CNC Lathe Machine",
    category: "machinery",
    unit: "pcs",
    currentStock: 0,
    reorderLevel: 0,
    unitPrice: 850000,
    warehouseLocation: "Bay 3",
    isMachine: true,
    condition: "good",
  });

  const forkliftBattery = await InventoryItem.create({
    company: acme._id,
    sku: "MC-FLB-014",
    name: "Forklift Battery Pack",
    category: "machinery",
    unit: "pcs",
    currentStock: 0,
    reorderLevel: 1,
    unitPrice: 45000,
    warehouseLocation: "Bay 1",
    isMachine: true,
    condition: "good",
  });

  console.log("Inventory items created");

  // ---------- Stock transaction history (demonstrates in/out/damage) ----------
  const stockOps = [
    // Steel rod: purchased, sold some, one damage report
    { item: steelRod, type: "in", quantity: 1000, reference: "PO-2001", notes: "Initial stock from supplier" },
    { item: steelRod, type: "out", quantity: 300, reference: "QT-1001", relatedClient: clientMehta._id, notes: "Dispatched to Mehta Steel" },
    { item: steelRod, type: "damage", quantity: 25, reference: "DMG-001", damageReason: "Water damage during monsoon storage", damageSeverity: "minor", notes: "Found rust on outer layer" },
    { item: steelRod, type: "out", quantity: 150, reference: "QT-1003", relatedClient: clientSharma._id, notes: "Dispatched to Sharma Constructions" },

    // Cement: purchased, damaged batch (major), sold rest
    { item: cementBag, type: "in", quantity: 500, reference: "PO-2002", notes: "Bulk purchase" },
    { item: cementBag, type: "damage", quantity: 40, reference: "DMG-002", damageReason: "Bags torn during forklift handling", damageSeverity: "major", notes: "Entire pallet compromised" },
    { item: cementBag, type: "out", quantity: 200, reference: "QT-1002", relatedClient: clientMehta._id, notes: "Dispatched to Mehta Steel" },

    // Lathe machine: received, later flagged under repair via damage entry
    { item: lathe, type: "in", quantity: 1, reference: "PO-2003", notes: "New machine commissioned in Bay 3" },
    { item: lathe, type: "damage", quantity: 1, reference: "DMG-003", damageReason: "Spindle bearing failure", damageSeverity: "major", notes: "Sent for repair, expected back in 2 weeks" },

    // Forklift battery: received, then a full loss
    { item: forkliftBattery, type: "in", quantity: 2, reference: "PO-2004", notes: "Spare battery packs" },
    { item: forkliftBattery, type: "damage", quantity: 1, reference: "DMG-004", damageReason: "Battery cell rupture / short circuit", damageSeverity: "total_loss", notes: "Scrapped, insurance claim filed" },
  ];

  for (const op of stockOps) {
    const item = op.item;
    if (op.type === "in") item.currentStock += op.quantity;
    if (op.type === "out" || op.type === "damage") item.currentStock -= op.quantity;
    if (op.type === "damage") {
      item.condition = op.damageSeverity === "total_loss" ? "scrapped" : "damaged";
    }
    await item.save();

    await StockTransaction.create({
      company: acme._id,
      item: item._id,
      type: op.type,
      quantity: op.quantity,
      reference: op.reference,
      relatedClient: op.relatedClient,
      damageReason: op.damageReason,
      damageSeverity: op.damageSeverity,
      notes: op.notes,
      performedBy: owner._id,
      stockAfter: item.currentStock,
    });
  }

  console.log("Stock transaction history created");

  // ---------- Quotations (Acme) ----------
  await Quotation.create({
    company: acme._id,
    quotationNumber: "QT-1001",
    client: clientMehta._id,
    clientName: clientMehta.name,
    billingAddress: clientMehta.billingAddress,
    shippingAddress: clientMehta.shippingAddress,
    items: [
      { item: steelRod._id, description: "Steel Rod 12mm", quantity: 300, unit: "kg", unitPrice: 65, taxPercent: 18, total: 300 * 65 * 1.18 },
    ],
    subtotal: 300 * 65,
    taxTotal: 300 * 65 * 0.18,
    grandTotal: 300 * 65 * 1.18,
    status: "accepted",
    validUntil: new Date("2026-09-30"),
    createdBy: owner._id,
  });

  await Quotation.create({
    company: acme._id,
    quotationNumber: "QT-1002",
    client: clientMehta._id,
    clientName: clientMehta.name,
    billingAddress: clientMehta.billingAddress,
    shippingAddress: clientMehta.shippingAddress,
    items: [
      { item: cementBag._id, description: "Cement Bag 50kg", quantity: 200, unit: "pcs", unitPrice: 380, taxPercent: 12, total: 200 * 380 * 1.12 },
    ],
    subtotal: 200 * 380,
    taxTotal: 200 * 380 * 0.12,
    grandTotal: 200 * 380 * 1.12,
    status: "sent",
    validUntil: new Date("2026-09-15"),
    createdBy: owner._id,
  });

  await Quotation.create({
    company: acme._id,
    quotationNumber: "QT-1003",
    client: clientSharma._id,
    clientName: clientSharma.name,
    brokerName: brokerGupta.name,
    billingAddress: clientSharma.billingAddress,
    shippingAddress: clientSharma.shippingAddress,
    items: [
      { item: steelRod._id, description: "Steel Rod 12mm", quantity: 150, unit: "kg", unitPrice: 68, taxPercent: 18, total: 150 * 68 * 1.18 },
    ],
    subtotal: 150 * 68,
    taxTotal: 150 * 68 * 0.18,
    grandTotal: 150 * 68 * 1.18,
    status: "draft",
    validUntil: new Date("2026-10-05"),
    createdBy: owner._id,
  });

  console.log("Quotations created");

  // ---------- BlueWave: a smaller data set to show the switcher works ----------
  const teakWood = await InventoryItem.create({
    company: bluewave._id,
    sku: "EXP-TWD-001",
    name: "Teak Wood Planks",
    category: "raw_material",
    unit: "pcs",
    currentStock: 0,
    reorderLevel: 50,
    unitPrice: 1200,
    warehouseLocation: "Container Yard 2",
    condition: "good",
  });

  teakWood.currentStock = 400;
  await teakWood.save();
  await StockTransaction.create({
    company: bluewave._id,
    item: teakWood._id,
    type: "in",
    quantity: 400,
    reference: "PO-EXP-01",
    notes: "Container arrival from Kerala supplier",
    performedBy: owner._id,
    stockAfter: 400,
  });

  await Quotation.create({
    company: bluewave._id,
    quotationNumber: "BWE-QT-001",
    client: clientOceanic._id,
    clientName: clientOceanic.name,
    billingAddress: clientOceanic.billingAddress,
    shippingAddress: clientOceanic.shippingAddress,
    items: [
      { item: teakWood._id, description: "Teak Wood Planks", quantity: 100, unit: "pcs", unitPrice: 1200, taxPercent: 0, total: 100 * 1200 },
    ],
    subtotal: 100 * 1200,
    taxTotal: 0,
    grandTotal: 100 * 1200,
    status: "sent",
    validUntil: new Date("2026-10-20"),
    createdBy: owner._id,
  });

  console.log("\n✅ Seed complete.");
  console.log("-----------------------------------------");
  console.log("Login with:");
  console.log("  Email:    owner@acmetraders.com");
  console.log("  Password: password123");
  console.log("  (has access to both Acme Traders and BlueWave Exports — use the switcher)");
  console.log("");
  console.log("Second user (Acme only, manager role):");
  console.log("  Email:    manager@acmetraders.com");
  console.log("  Password: password123");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
