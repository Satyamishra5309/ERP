import express from "express";
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getItemHistory,
  recordTransaction,
  listAllTransactions,
} from "../controllers/inventoryController.js";
import { protect } from "../middleware/auth.js";
import { resolveTenant } from "../middleware/tenant.js";

const router = express.Router();
router.use(protect, resolveTenant);

router.route("/items").get(listItems).post(createItem);
router.route("/items/:id").get(getItem).put(updateItem).delete(deleteItem);
router.get("/items/:id/history", getItemHistory);

router.post("/transactions", recordTransaction);
router.get("/transactions", listAllTransactions);

export default router;
