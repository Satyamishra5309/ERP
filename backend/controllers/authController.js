import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Company from "../models/Company.js";

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @desc Register first user + their first company (becomes "owner")
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const company = await Company.create({ name: companyName });

  const user = await User.create({
    name,
    email,
    password,
    memberships: [{ company: company._id, role: "owner" }],
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: genToken(user._id),
    memberships: [{ company, role: "owner" }],
  });
});

// @desc Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate("memberships.company");

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: genToken(user._id),
      memberships: user.memberships,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Get logged in user profile + companies they can switch between
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("memberships.company");
  res.json(user);
});

// @desc Create/join an additional company under the same user (multi-company support)
export const createCompany = asyncHandler(async (req, res) => {
  const { name, legalName, gstin, address, phone, email } = req.body;

  const company = await Company.create({
    name,
    legalName,
    gstin,
    address,
    phone,
    email,
    createdBy: req.user._id,
  });

  const user = await User.findById(req.user._id);
  user.memberships.push({ company: company._id, role: "owner" });
  await user.save();

  res.status(201).json(company);
});
