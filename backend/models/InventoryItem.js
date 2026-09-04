import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: String, // e.g. raw_material, finished_good, machine_part
    unit: { type: String, default: "pcs" }, // pcs, kg, ltr, meter...
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    unitPrice: Number,
    warehouseLocation: String,
    isMachine: { type: Boolean, default: false }, // flag for machinery/equipment items
    condition: { type: String, enum: ["new", "good", "damaged", "under_repair", "scrapped"], default: "good" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ company: 1, sku: 1 }, { unique: true });

export default mongoose.model("InventoryItem", inventoryItemSchema);
