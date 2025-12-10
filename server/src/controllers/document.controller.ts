import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AuditLogModel } from "../models/audit-log.model.js";
import { DocumentModel, type IFieldData } from "../models/document.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import { calculateHash } from "../utils/hash.js";
import { burnSignatureIntoPdf } from "../services/pdf-processor.js";
import { signedDir } from "../config/upload.config.js";

export const uploadDocument = catchAsync(async (req, res, _next) => {
  const file = req.file;
  if (!file) {
    throw new AppError(400, "No PDF file provided");
  }

  // Read file and calculate hash
  const fileBuffer = await fs.readFile(file.path);
  const originalHash = calculateHash(fileBuffer);

  // Create document record
  const document = await DocumentModel.create({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    originalHash,
    status: "pending",
  });

  // Create audit log entry
  await AuditLogModel.create({
    documentId: document._id,
    action: "created",
    originalHash,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(201).json({
    status: "success",
    data: {
      id: document._id,
      filename: document.originalName,
      originalHash,
      status: document.status,
      createdAt: document.createdAt,
    },
  });
});

export const getDocumentMetadata = catchAsync(async (req, res, next) => {
  const document = await DocumentModel.findById(req.params.id);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  // Log view action
  await AuditLogModel.create({
    documentId: document._id,
    action: "viewed",
    originalHash: document.originalHash,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    status: "success",
    data: {
      id: document._id,
      filename: document.originalName,
      originalHash: document.originalHash,
      signedHash: document.signedHash,
      status: document.status,
      fields: document.fields,
      createdAt: document.createdAt,
      signedAt: document.signedAt,
    },
  });
});

export const signDocument = catchAsync(async (req, res, next) => {
  const { documentId, fields, signatureImage } = req.body as {
    documentId: string;
    fields: IFieldData[];
    signatureImage?: string;
  };

  if (!documentId) {
    return next(new AppError(400, "Document ID is required"));
  }

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return next(new AppError(400, "Fields array is required"));
  }

  // Find document
  const document = await DocumentModel.findById(documentId);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  if (document.status === "signed") {
    return next(new AppError(400, "Document is already signed"));
  }

  // Read original PDF
  const pdfBuffer = await fs.readFile(document.path);

  // Verify original hash
  const currentHash = calculateHash(pdfBuffer);
  if (currentHash !== document.originalHash) {
    return next(new AppError(400, "Document integrity check failed"));
  }

  // Burn signature and fields into PDF
  const signedPdfBytes = await burnSignatureIntoPdf(pdfBuffer, {
    signatureBase64: signatureImage || "",
    fields,
  });

  // Calculate signed PDF hash
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
    metadata: { fieldsCount: fields.length },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({
    status: "success",
    data: {
      id: document._id,
      filename: document.originalName,
      originalHash: document.originalHash,
      signedHash,
      status: document.status,
      signedAt: document.signedAt,
      downloadUrl: `/api/documents/${document._id}/download`,
    },
  });
});

export const downloadSignedDocument = catchAsync(async (req, res, next) => {
  const document = await DocumentModel.findById(req.params.id);
  if (!document) {
    return next(new AppError(404, "Document not found"));
  }

  if (document.status !== "signed" || !document.signedPdfPath) {
    return next(new AppError(400, "Document has not been signed yet"));
  }

  // Log download action
  await AuditLogModel.create({
    documentId: document._id,
    action: "downloaded",
    originalHash: document.originalHash,
    resultHash: document.signedHash,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.download(
    document.signedPdfPath,
    `signed_${document.originalName}`,
    (err) => {
      if (err) {
        console.error("Download error:", err);
      }
    }
  );
});
