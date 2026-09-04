import express from "express";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/auth.js";
import { resolveTenant, requireRole } from "../middleware/tenant.js";

const router = express.Router();
router.use(protect, resolveTenant);

router.route("/").get(listEmployees).post(requireRole("owner", "admin", "manager"), createEmployee);
router
  .route("/:id")
  .get(getEmployee)
  .put(requireRole("owner", "admin", "manager"), updateEmployee)
  .delete(requireRole("owner", "admin"), deleteEmployee);

export default router;
