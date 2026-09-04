import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
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

const clientSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    type: { type: String, enum: ["client", "broker"], default: "client" },
    name: { type: String, required: true }, // client / broker name
    brokerName: { type: String }, // if a broker is handling this client's deals
    contactPerson: String,
    email: String,
    phone: String,
    gstin: String,
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    sameAsBilling: { type: Boolean, default: false },
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
