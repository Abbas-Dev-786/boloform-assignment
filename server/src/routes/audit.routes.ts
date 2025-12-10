import { Router, type IRouter } from "express";
import {
  getAuditTrail,
  verifyDocumentIntegrity,
} from "../controllers/audit.controller.js";

const router: IRouter = Router();

/**
 * GET /api/audit/:documentId
 * Get audit trail for a document
 */
router.get("/:documentId", getAuditTrail);

/**
 * POST /api/audit/verify
 * Verify document integrity by comparing hashes
 */
router.post("/verify", verifyDocumentIntegrity);

export default router;
