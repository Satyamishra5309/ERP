import mongoose from "mongoose";

// Every stock movement (in, out, or damage report) is recorded here so
// each inventory item has a full, permanent history.
const stockTransactionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    type: {
      type: String,
      enum: ["in", "out", "damage", "adjustment", "return"],
      required: true,
    },
    quantity: { type: Number, required: true }, // always positive; sign handled by `type`
    reference: String, // e.g. PO number, quotation number, work order
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    damageReason: String, // used when type === "damage"
    damageSeverity: { type: String, enum: ["minor", "major", "total_loss"] },
    notes: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stockAfter: Number, // snapshot of currentStock right after this transaction, for audit history
  },
  { timestamps: true }
);

stockTransactionSchema.index({ company: 1, item: 1, createdAt: -1 });

export default mongoose.model("StockTransaction", stockTransactionSchema);
