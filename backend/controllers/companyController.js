import asyncHandler from "express-async-handler";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Client from "../models/Client.js";
import Quotation from "../models/Quotation.js";
import InventoryItem from "../models/InventoryItem.js";
import StockTransaction from "../models/StockTransaction.js";

const getMembership = (user, companyId) =>
  user.memberships.find((m) => m.company.toString() === companyId);

// @desc List companies the logged-in user can switch between
export const listCompanies = asyncHandler(async (req, res) => {
  const ids = req.user.memberships.map((m) => m.company);
  const companies = await Company.find({ _id: { $in: ids } });
  const withRole = companies.map((c) => {
    const membership = getMembership(req.user, c._id.toString());
    return { ...c.toObject(), role: membership.role };
  });
  res.json(withRole);
});

// @desc Update company details (owner/admin only)
export const updateCompany = asyncHandler(async (req, res) => {
  const membership = getMembership(req.user, req.params.id);
  if (!membership) {
    res.status(403);
    throw new Error("You do not have access to this company");
  }
  if (!["owner", "admin"].includes(membership.role)) {
    res.status(403);
    throw new Error("Only an owner or admin can edit company details");
  }

  const { name, legalName, gstin, address, phone, email } = req.body;
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { name, legalName, gstin, address, phone, email },
    { new: true, runValidators: true }
  );
  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }
  res.json({ ...company.toObject(), role: membership.role });
});

// @desc Delete a company. Owner only. Cascades: removes all company-scoped
// data (employees, clients, quotations, inventory, stock history) and strips
// the membership from every user who had access — including yourself.
export const deleteCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.id;
  const membership = getMembership(req.user, companyId);
  if (!membership) {
    res.status(403);
    throw new Error("You do not have access to this company");
  }
  if (membership.role !== "owner") {
    res.status(403);
    throw new Error("Only the owner can delete a company");
  }

  const company = await Company.findById(companyId);
  if (!company) {
    res.status(404);
    throw new Error("Company not found");
  }

  await Promise.all([
    Employee.deleteMany({ company: companyId }),
    Client.deleteMany({ company: companyId }),
    Quotation.deleteMany({ company: companyId }),
    InventoryItem.deleteMany({ company: companyId }),
    StockTransaction.deleteMany({ company: companyId }),
    User.updateMany(
      { "memberships.company": companyId },
      { $pull: { memberships: { company: companyId } } }
    ),
    Company.findByIdAndDelete(companyId),
  ]);

  res.json({ message: "Company and all associated data have been deleted" });
});
