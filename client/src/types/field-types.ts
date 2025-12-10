// Field types for the PDF Signature Injection Engine

export type FieldType = 'text' | 'signature' | 'image' | 'date' | 'radio';

/**
 * Field position and dimensions stored as normalized values (0-1)
 * relative to PDF page dimensions for responsive positioning.
 * 
 * Example: { x: 0.15, y: 0.25, width: 0.3, height: 0.1 }
 * Means: 15% from left, 25% from top, 30% wide, 10% tall
 */
export interface FieldData {
  id: string;
  type: FieldType;
  pageNumber: number;
  
  // Normalized coordinates (0-1 range, relative to PDF dimensions)
  x: number;      // Distance from left edge (0 = left, 1 = right)
  y: number;      // Distance from top edge (0 = top, 1 = bottom)
  width: number;  // Width as fraction of page width
  height: number; // Height as fraction of page height
  
  // Field-specific data
  value?: string;           // Text content or signature data URL
  options?: string[];       // For radio buttons
  placeholder?: string;     // Placeholder text
  required?: boolean;       // Is this field required?
}

/**
 * Payload sent to backend for PDF signing
 */
export interface SignRequest {
  documentId: string;
  fields: FieldData[];
  signatureImage?: string; // Base64 encoded signature image
}

/**
 * Document metadata from backend
 */
export interface DocumentMeta {
  id: string;
  filename: string;
  originalHash: string;
  signedHash?: string;
  status: 'pending' | 'signed';
  createdAt: string;
  signedAt?: string;
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  id: string;
  documentId: string;
  action: 'created' | 'viewed' | 'signed';
  originalHash: string;
  resultHash?: string;
  timestamp: string;
}

/**
 * PDF dimensions in pixels (for current render scale)
 */
export interface PDFDimensions {
  width: number;
  height: number;
  scale: number;
}

/**
 * Utility to generate unique field IDs
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert pixel coordinates to normalized (0-1) coordinates
 */
export function pixelToNormalized(
  pixelX: number,
  pixelY: number,
  pixelWidth: number,
  pixelHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: pixelX / canvasWidth,
    y: pixelY / canvasHeight,
    width: pixelWidth / canvasWidth,
    height: pixelHeight / canvasHeight,
  };
}

/**
 * Convert normalized coordinates back to pixels
 */
export function normalizedToPixel(
  normX: number,
  normY: number,
  normWidth: number,
  normHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: normX * canvasWidth,
    y: normY * canvasHeight,
    width: normWidth * canvasWidth,
    height: normHeight * canvasHeight,
  };
}
