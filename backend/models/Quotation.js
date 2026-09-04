import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
    description: String,
    quantity: { type: Number, required: true },
    unit: String,
    unitPrice: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    total: Number,
  },
  { _id: false }
);

const addressSnapshot = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    quotationNumber: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    clientName: String,
    brokerName: String,
    // Address snapshots so historical quotations don't change if client address is edited later
    billingAddress: addressSnapshot,
    shippingAddress: addressSnapshot,
    items: [lineItemSchema],
    subtotal: Number,
    taxTotal: Number,
    grandTotal: Number,
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired"],
      default: "draft",
    },
    validUntil: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

quotationSchema.index({ company: 1, quotationNumber: 1 }, { unique: true });

export default mongoose.model("Quotation", quotationSchema);
