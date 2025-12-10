// Types matching backend models
export interface FieldData {
  id: string;
  type: "text" | "signature" | "image" | "date" | "radio";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  required?: boolean;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  originalHash: string;
  signedHash?: string;
  status: "pending" | "signed";
  fields?: FieldData[];
  createdAt: string;
  signedAt?: string;
}

export interface UploadResponse {
  status: string;
  data: DocumentResponse;
}

export interface SignPdfRequest {
  documentId: string;
  fields: FieldData[];
  signatureImage?: string;
}

export interface SignPdfResponse {
  status: string;
  data: {
    id: string;
    filename: string;
    originalHash: string;
    signedHash: string;
    status: string;
    signedAt: string;
    downloadUrl: string;
  };
}

export interface AuditLogEntry {
  id: string;
  action: "created" | "viewed" | "signed" | "downloaded";
  originalHash?: string;
  resultHash?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuditTrailResponse {
  status: string;
  data: {
    documentId: string;
    filename: string;
    currentStatus: string;
    originalHash: string;
    signedHash?: string;
    auditTrail: AuditLogEntry[];
  };
}

export interface VerifyResponse {
  status: string;
  data: {
    documentId: string;
    filename: string;
    verification: {
      originalDocument: {
        intact: boolean;
        expectedHash: string;
      };
      signedDocument?: {
        intact: boolean;
        expectedHash: string;
      } | null;
    };
    overallStatus: "verified" | "tampered";
  };
}

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Generic API error
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Helper for API calls
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new ApiError(response.status, error.message || "Request failed");
  }

  return response.json();
}

// Document APIs
export const documentApi = {
  /**
   * Upload a PDF file
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new ApiError(response.status, error.message);
    }

    return response.json();
  },

  /**
   * Get document metadata
   */
  async get(documentId: string): Promise<{ status: string; data: DocumentResponse }> {
    return apiRequest(`/documents/${documentId}`);
  },

  /**
   * Sign a PDF with fields and signature
   */
  async signPdf(request: SignPdfRequest): Promise<SignPdfResponse> {
    return apiRequest("/documents/sign-pdf", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Get download URL for signed PDF
   */
  getDownloadUrl(documentId: string): string {
    return `${API_BASE}/documents/${documentId}/download`;
  },
};

// Audit APIs
export const auditApi = {
  /**
   * Get audit trail for a document
   */
  async getAuditTrail(documentId: string): Promise<AuditTrailResponse> {
    return apiRequest(`/audit/${documentId}`);
  },

  /**
   * Verify document integrity
   */
  async verify(documentId: string): Promise<VerifyResponse> {
    return apiRequest("/audit/verify", {
      method: "POST",
      body: JSON.stringify({ documentId }),
    });
  },
};

// Share APIs
export interface PrepareShareResponse {
  status: string;
  data: {
    documentId: string;
    shareUrl: string;
    fieldsCount: number;
  };
}

export const shareApi = {
  /**
   * Prepare document for sharing (save fields)
   */
  async prepare(documentId: string, fields: FieldData[]): Promise<PrepareShareResponse> {
    return apiRequest(`/share/prepare/${documentId}`, {
      method: "POST",
      body: JSON.stringify({ fields }),
    });
  },

  /**
   * Get full share URL
   */
  getShareUrl(documentId: string): string {
    return `${window.location.origin}/sign/${documentId}`;
  },
};
