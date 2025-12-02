import express from "express";

const router = express.Router();

import { getNearbyRivers } from "../controllers/rivers.controllers.js";
import validateRiverQuery from "../middleware/validation.js";

//route to handle /api/rivers/nearby
router.get("/nearby", validateRiverQuery, getNearbyRivers);

export default router;
