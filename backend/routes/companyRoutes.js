import express from "express";
import { listCompanies, updateCompany, deleteCompany } from "../controllers/companyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", listCompanies);
router.route("/:id").put(updateCompany).delete(deleteCompany);

export default router;
