import express from "express";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import { protect } from "../middleware/auth.js";
import { resolveTenant } from "../middleware/tenant.js";

const router = express.Router();
router.use(protect, resolveTenant);

router.route("/").get(listClients).post(createClient);
router.route("/:id").get(getClient).put(updateClient).delete(deleteClient);

export default router;
