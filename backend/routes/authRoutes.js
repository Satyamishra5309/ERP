import express from "express";
import { register, login, getProfile, createCompany } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post("/companies", protect, createCompany);

export default router;
