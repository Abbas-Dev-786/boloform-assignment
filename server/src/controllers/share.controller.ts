import { AuditLogModel } from "../models/audit-log.model.js";
import { DocumentModel } from "../models/document.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { burnSignatureIntoPdf } from "../services/pdf-processor.js";
import { signedDir } from "../config/upload.config.js";
import { calculateHash } from "../utils/hash.js";

export const prepareDocumentForSigning = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { fields } = req.body;

  if (!fields || !Array.isArray(fields)) {
    return next(new AppError(400, "Fields array is required"));
  }

  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  if (document.status === "signed") {
    return next(new AppError(400, "Document is already signed"));
  }

  // Save fields to document
  document.fields = fields;
  await document.save();

  // Create audit log
  await AuditLogModel.create({
    documentId: document._id,
    action: "viewed",
    originalHash: document.originalHash,
    metadata: { action: "fields_saved", fieldsCount: fields.length },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Generate share URL (public - no token needed)
  const shareUrl = `/sign/${documentId}`;

  res.json({
    status: "success",
    data: {
      documentId,
      shareUrl,
      fieldsCount: fields.length,
    },
  });
});

export const getSharedDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;

  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  // Log view
  await AuditLogModel.create({
    documentId: document._id,
    action: "viewed",
    originalHash: document.originalHash,
    metadata: { action: "signer_view" },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    status: "success",
    data: {
      id: document._id,
      filename: document.originalName,
      status: document.status,
      fields: document.fields,
      // Return URL to original PDF for viewing
      pdfUrl: `/uploads/${document.filename}`,
    },
  });
});

export const completeDocumentSigning = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { fields, signatureImage, signerName, signerEmail } = req.body;

  if (!fields || !Array.isArray(fields)) {
    return next(new AppError(400, "Fields array is required"));
  }

  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  if (document.status === "signed") {
    return next(new AppError(400, "Document is already signed"));
  }

  // Read original PDF
  const pdfBuffer = await fs.readFile(document.path);

  // Verify integrity
  const currentHash = calculateHash(pdfBuffer);
  if (currentHash !== document.originalHash) {
    return next(new AppError(400, "Document integrity check failed"));
  }

  // Burn fields with values into PDF
  const signedPdfBytes = await burnSignatureIntoPdf(pdfBuffer, {
    signatureBase64: signatureImage || "",
    fields,
  });

  // Calculate signed hash
  const signedBuffer = Buffer.from(signedPdfBytes);
  const signedHash = calculateHash(signedBuffer);

  // Save signed PDF
  const signedFilename = `signed_${uuidv4()}.pdf`;
  const signedPath = path.join(signedDir, signedFilename);
  await fs.writeFile(signedPath, signedBuffer);

  // Update document
  document.status = "signed";
  document.signedHash = signedHash;
  document.signedPdfPath = signedPath;
  document.fields = fields;
  document.signedAt = new Date();
  await document.save();

  // Create audit log
  await AuditLogModel.create({
    documentId: document._id,
    action: "signed",
    originalHash: document.originalHash,
    resultHash: signedHash,
    metadata: {
      signerName: signerName || "Anonymous",
      signerEmail: signerEmail || null,
      fieldsCount: fields.length,
    },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    status: "success",
    data: {
      id: document._id,
      filename: document.originalName,
      signedHash,
      signedAt: document.signedAt,
      downloadUrl: `/api/v1/documents/${document._id}/download`,
    },
  });
});
