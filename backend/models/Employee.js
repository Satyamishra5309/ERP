import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employeeId: { type: String, required: true }, // human-readable code e.g. EMP-001
    name: { type: String, required: true },
    designation: String,
    department: String,
    email: String,
    phone: String,
    dateOfJoining: Date,
    salary: Number,
    status: { type: String, enum: ["active", "on_leave", "terminated"], default: "active" },
    address: String,
    documents: [{ title: String, url: String }],
  },
  { timestamps: true }
);

employeeSchema.index({ company: 1, employeeId: 1 }, { unique: true });

export default mongoose.model("Employee", employeeSchema);
