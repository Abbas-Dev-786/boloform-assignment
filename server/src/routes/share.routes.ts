import { Router, type IRouter } from "express";
import {
  completeDocumentSigning,
  getSharedDocument,
  prepareDocumentForSigning,
} from "../controllers/share.controller.js";

const router: IRouter = Router();

/**
 * POST /api/v1/share/prepare/:documentId
 * Save fields to document and prepare for sharing
 */
router.post("/prepare/:documentId", prepareDocumentForSigning);

/**
 * GET /api/v1/share/:documentId
 * Get document info for signer view (public)
 */
router.get("/:documentId", getSharedDocument);

/**
 * POST /api/v1/share/complete/:documentId
 * Complete signing with filled field values
 */
router.post("/complete/:documentId", completeDocumentSigning);

export default router;
