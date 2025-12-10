import mongoose, { type Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  documentId: mongoose.Types.ObjectId;
  action: "created" | "viewed" | "signed" | "downloaded";
  originalHash?: string;
  resultHash?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["created", "viewed", "signed", "downloaded"],
      required: true,
    },
    originalHash: { type: String },
    resultHash: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
