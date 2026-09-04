import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";

export const listEmployees = asyncHandler(async (req, res) => {
  const { status, department, search } = req.query;
  const filter = { company: req.companyId };
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (search) filter.name = { $regex: search, $options: "i" };

  const employees = await Employee.find(filter).sort({ createdAt: -1 });
  res.json(employees);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, company: req.companyId });
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json(employee);
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.create({ ...req.body, company: req.companyId });
  res.status(201).json(employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json({ message: "Employee removed" });
});
