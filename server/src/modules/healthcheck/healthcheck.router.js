import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";

const router = Router();
/**
 * @route   GET /
 * @desc    Health check endpoint to verify that the server is running
 * @access  Public
 *
 * This defines a GET request on the root ("/") path.
 * When this route is hit, it calls the `healthCheck` controller function,
 * which responds with a simple message/status to confirm the API is live.
 */
router.route("/").get(healthCheck);


export default router;