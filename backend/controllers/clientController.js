import asyncHandler from "express-async-handler";
import Client from "../models/Client.js";

export const listClients = asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const filter = { company: req.companyId };
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };

  const clients = await Client.find(filter).sort({ createdAt: -1 });
  res.json(clients);
});

export const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, company: req.companyId });
  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }
  res.json(client);
});

export const createClient = asyncHandler(async (req, res) => {
  const body = { ...req.body, company: req.companyId };
  if (body.sameAsBilling) {
    body.shippingAddress = body.billingAddress;
  }
  const client = await Client.create(body);
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.sameAsBilling && body.billingAddress) {
    body.shippingAddress = body.billingAddress;
  }
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    body,
    { new: true, runValidators: true }
  );
  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }
  res.json(client);
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }
  res.json({ message: "Client removed" });
});
