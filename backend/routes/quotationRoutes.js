import express from "express";
import {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
} from "../controllers/quotationController.js";
import { protect } from "../middleware/auth.js";
import { resolveTenant } from "../middleware/tenant.js";

const router = express.Router();
router.use(protect, resolveTenant);

router.route("/").get(listQuotations).post(createQuotation);
router.route("/:id").get(getQuotation).put(updateQuotation).delete(deleteQuotation);
router.patch("/:id/status", updateQuotationStatus);

export default router;
