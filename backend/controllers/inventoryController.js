import asyncHandler from "express-async-handler";
import InventoryItem from "../models/InventoryItem.js";
import StockTransaction from "../models/StockTransaction.js";

export const listItems = asyncHandler(async (req, res) => {
  const { category, isMachine, lowStock, search } = req.query;
  const filter = { company: req.companyId };
  if (category) filter.category = category;
  if (isMachine) filter.isMachine = isMachine === "true";
  if (search) filter.name = { $regex: search, $options: "i" };

  let items = await InventoryItem.find(filter).sort({ createdAt: -1 });
  if (lowStock === "true") {
    items = items.filter((i) => i.currentStock <= i.reorderLevel);
  }
  res.json(items);
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, company: req.companyId });
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json(item);
});

export const createItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.create({ ...req.body, company: req.companyId });
  res.status(201).json(item);
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json(item);
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json({ message: "Item removed" });
});

// @desc Get full movement history (in/out/damage/adjustment) for one item
export const getItemHistory = asyncHandler(async (req, res) => {
  const history = await StockTransaction.find({ item: req.params.id, company: req.companyId })
    .sort({ createdAt: -1 })
    .populate("performedBy", "name")
    .populate("relatedClient", "name");
  res.json(history);
});

// @desc Record a stock movement: in, out, damage, adjustment, or return.
// This is the single entry point that keeps InventoryItem.currentStock and
// StockTransaction history perfectly in sync.
export const recordTransaction = asyncHandler(async (req, res) => {
  const { itemId, type, quantity, reference, relatedClient, damageReason, damageSeverity, notes } = req.body;

  if (!["in", "out", "damage", "adjustment", "return"].includes(type)) {
    res.status(400);
    throw new Error("Invalid transaction type");
  }
  if (!quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Quantity must be greater than zero");
  }

  const item = await InventoryItem.findOne({ _id: itemId, company: req.companyId });
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  // "in" and "return" increase stock; "out" and "damage" decrease it;
  // "adjustment" is treated as a direct correction (quantity can represent new count via notes).
  if (type === "in" || type === "return") {
    item.currentStock += quantity;
  } else if (type === "out" || type === "damage") {
    if (item.currentStock < quantity) {
      res.status(400);
      throw new Error("Insufficient stock for this operation");
    }
    item.currentStock -= quantity;
    if (type === "damage") {
      item.condition = damageSeverity === "total_loss" ? "scrapped" : "damaged";
    }
  } else if (type === "adjustment") {
    item.currentStock = quantity; // treat quantity as the corrected absolute count
  }

  await item.save();

  const txn = await StockTransaction.create({
    company: req.companyId,
    item: item._id,
    type,
    quantity,
    reference,
    relatedClient: relatedClient || undefined,
    damageReason,
    damageSeverity,
    notes,
    performedBy: req.user._id,
    stockAfter: item.currentStock,
  });

  res.status(201).json({ transaction: txn, item });
});

// @desc Company-wide transaction feed (for a dashboard "recent activity" list)
export const listAllTransactions = asyncHandler(async (req, res) => {
  const { type, limit = 50 } = req.query;
  const filter = { company: req.companyId };
  if (type) filter.type = type;

  const transactions = await StockTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("item", "name sku")
    .populate("performedBy", "name");

  res.json(transactions);
});
