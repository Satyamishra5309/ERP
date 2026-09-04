import asyncHandler from "express-async-handler";
import Quotation from "../models/Quotation.js";
import Client from "../models/Client.js";

const computeTotals = (items) => {
  let subtotal = 0;
  let taxTotal = 0;
  const priced = items.map((it) => {
    const lineBase = it.quantity * it.unitPrice;
    const lineTax = (lineBase * (it.taxPercent || 0)) / 100;
    subtotal += lineBase;
    taxTotal += lineTax;
    return { ...it, total: lineBase + lineTax };
  });
  return { items: priced, subtotal, taxTotal, grandTotal: subtotal + taxTotal };
};

export const listQuotations = asyncHandler(async (req, res) => {
  const { status, client } = req.query;
  const filter = { company: req.companyId };
  if (status) filter.status = status;
  if (client) filter.client = client;

  const quotations = await Quotation.find(filter).sort({ createdAt: -1 }).populate("client", "name type");
  res.json(quotations);
});

export const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOne({ _id: req.params.id, company: req.companyId }).populate("client");
  if (!quotation) {
    res.status(404);
    throw new Error("Quotation not found");
  }
  res.json(quotation);
});

export const createQuotation = asyncHandler(async (req, res) => {
  const { client: clientId, items, quotationNumber, validUntil, brokerName } = req.body;

  const client = await Client.findOne({ _id: clientId, company: req.companyId });
  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }

  const { items: pricedItems, subtotal, taxTotal, grandTotal } = computeTotals(items);

  const quotation = await Quotation.create({
    company: req.companyId,
    quotationNumber,
    client: client._id,
    clientName: client.name,
    brokerName: brokerName || client.brokerName,
    billingAddress: client.billingAddress,
    shippingAddress: client.shippingAddress,
    items: pricedItems,
    subtotal,
    taxTotal,
    grandTotal,
    validUntil,
    createdBy: req.user._id,
  });

  res.status(201).json(quotation);
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const { client: clientId, items, quotationNumber, validUntil, brokerName, refreshAddresses } = req.body;

  const update = {};
  if (quotationNumber) update.quotationNumber = quotationNumber;
  if (validUntil) update.validUntil = validUntil;
  if (brokerName !== undefined) update.brokerName = brokerName;

  if (items) {
    const { items: pricedItems, subtotal, taxTotal, grandTotal } = computeTotals(items);
    update.items = pricedItems;
    update.subtotal = subtotal;
    update.taxTotal = taxTotal;
    update.grandTotal = grandTotal;
  }

  // If the client changed, or the caller explicitly asks to refresh, re-snapshot
  // the client's current name/addresses onto the quotation.
  if (clientId || refreshAddresses) {
    const client = await Client.findOne({ _id: clientId, company: req.companyId });
    if (!client) {
      res.status(404);
      throw new Error("Client not found");
    }
    update.client = client._id;
    update.clientName = client.name;
    update.billingAddress = client.billingAddress;
    update.shippingAddress = client.shippingAddress;
    if (brokerName === undefined) update.brokerName = client.brokerName;
  }

  const quotation = await Quotation.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    update,
    { new: true, runValidators: true }
  );
  if (!quotation) {
    res.status(404);
    throw new Error("Quotation not found");
  }
  res.json(quotation);
});

export const updateQuotationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const quotation = await Quotation.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    { status },
    { new: true }
  );
  if (!quotation) {
    res.status(404);
    throw new Error("Quotation not found");
  }
  res.json(quotation);
});

export const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!quotation) {
    res.status(404);
    throw new Error("Quotation not found");
  }
  res.json({ message: "Quotation removed" });
});
