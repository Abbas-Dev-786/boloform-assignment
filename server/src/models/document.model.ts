import mongoose, { type Document, Schema } from "mongoose";

// Field data structure (matches frontend)
export interface IFieldData {
  id: string;
  type: "text" | "signature" | "image" | "date" | "radio";
  pageNumber: number;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  width: number; // Normalized 0-1
  height: number; // Normalized 0-1
  value?: string;
  required?: boolean;
}

export interface IDocument extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  originalHash: string;
  signedHash?: string;
  status: "pending" | "signed";
  fields: IFieldData[];
  signedPdfPath?: string;
  createdAt: Date;
  signedAt?: Date;
}

const FieldSchema = new Schema<IFieldData>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "signature", "image", "date", "radio"],
      required: true,
    },
    pageNumber: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    value: { type: String },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    originalHash: { type: String, required: true },
    signedHash: { type: String },
    status: {
      type: String,
      enum: ["pending", "signed"],
      default: "pending",
    },
    fields: [FieldSchema],
    signedPdfPath: { type: String },
    signedAt: { type: Date },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>("Document", DocumentSchema);
