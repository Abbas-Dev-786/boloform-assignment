import fs from "fs/promises";
import { AuditLogModel } from "../models/audit-log.model.js";
import { DocumentModel } from "../models/document.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import { calculateHash } from "../utils/hash.js";

export const getAuditTrail = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;

  // Verify document exists
  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  // Get all audit logs for this document
  const auditLogs = await AuditLogModel.find({ documentId })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    status: "success",
    data: {
      documentId,
      filename: document.originalName,
      currentStatus: document.status,
      originalHash: document.originalHash,
      signedHash: document.signedHash,
      auditTrail: auditLogs.map((log) => ({
        id: log._id,
        action: log.action,
        originalHash: log.originalHash,
        resultHash: log.resultHash,
        timestamp: log.createdAt,
        metadata: log.metadata,
      })),
    },
  });
});

export const verifyDocumentIntegrity = catchAsync(async (req, res, next) => {
  const { documentId } = req.body as { documentId: string };

  if (!documentId) {
    return next(new AppError(400, "Document ID is required"));
  }

  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  // Verify original document integrity
  let originalIntact = false;
  try {
    const originalBuffer = await fs.readFile(document.path);
    const currentHash = calculateHash(originalBuffer);
    originalIntact = currentHash === document.originalHash;
  } catch {
    originalIntact = false;
  }

  // Verify signed document integrity (if exists)
  let signedIntact: boolean | null = null;
  if (document.signedPdfPath && document.signedHash) {
    try {
      const signedBuffer = await fs.readFile(document.signedPdfPath);
      const currentSignedHash = calculateHash(signedBuffer);
      signedIntact = currentSignedHash === document.signedHash;
    } catch {
      signedIntact = false;
    }
  }

  res.json({
    status: "success",
    data: {
      documentId,
      filename: document.originalName,
      verification: {
        originalDocument: {
          intact: originalIntact,
          expectedHash: document.originalHash,
        },
        signedDocument: document.signedHash
          ? {
              intact: signedIntact,
              expectedHash: document.signedHash,
            }
          : null,
      },
      overallStatus:
        originalIntact && (signedIntact === null || signedIntact)
          ? "verified"
          : "tampered",
    },
  });
});
