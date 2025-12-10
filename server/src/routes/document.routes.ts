import { Router, type IRouter } from "express";
import { uploadPdf } from "../config/upload.config.js";
import {
  downloadSignedDocument,
  getDocumentMetadata,
  signDocument,
  uploadDocument,
} from "../controllers/document.controller.js";

const router: IRouter = Router();

/**
 * POST /api/documents/upload
 * Upload a new PDF document
 */
router.post("/upload", uploadPdf.single("pdf"), uploadDocument);

/**
 * GET /api/documents/:id
 * Get document metadata
 */
router.get("/:id", getDocumentMetadata);

/**
 * POST /api/documents/sign-pdf
 * Sign a PDF with fields and signature
 */
router.post("/sign-pdf", signDocument);

/**
 * GET /api/documents/:id/download
 * Download signed PDF
 */
router.get("/:id/download", downloadSignedDocument);

export default router;
