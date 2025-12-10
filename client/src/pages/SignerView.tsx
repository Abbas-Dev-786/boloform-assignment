import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Document, Page } from "react-pdf";
import { FileText, Loader2, CheckCircle, Download, AlertCircle, X, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import SignaturePad from "../components/custom/signature-pad";
import type { FieldData } from "../types/field-types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Field colors for display
const FIELD_COLORS: Record<string, string> = {
    text: "#3b82f6",
    signature: "#22c55e",
    image: "#a855f7",
    date: "#f97316",
    radio: "#ec4899",
};

const FIELD_LABELS: Record<string, string> = {
    text: "Click to enter text",
    signature: "Click to sign",
    image: "Click to upload image",
    date: "Date",
    radio: "Click to select",
};

const SignerView = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [document, setDocument] = useState<{
        id: string;
        filename: string;
        status: string;
        fields: FieldData[];
        pdfUrl: string;
    } | null>(null);

    const [filledValues, setFilledValues] = useState<Record<string, string>>({});
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    // Text input modal state
    const [showTextModal, setShowTextModal] = useState(false);
    const [textInputValue, setTextInputValue] = useState("");

    const [numPages, setNumPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

    // Load document data
    useEffect(() => {
        const loadDocument = async () => {
            if (!documentId) return;

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/share/${documentId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load document");
                }

                if (data.data.status === "signed") {
                    setError("This document has already been signed.");
                    return;
                }

                setDocument(data.data);

                // Initialize filled values with existing field values
                const initialValues: Record<string, string> = {};
                data.data.fields?.forEach((field: FieldData) => {
                    if (field.value) {
                        initialValues[field.id] = field.value;
                    } else if (field.type === "date") {
                        initialValues[field.id] = new Date().toLocaleDateString();
                    }
                });
                setFilledValues(initialValues);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        loadDocument();
    }, [documentId]);

    const handleFieldClick = (field: FieldData) => {
        console.log("Field clicked:", field);
        setActiveFieldId(field.id);

        if (field.type === "signature") {
            setShowSignaturePad(true);
        } else if (field.type === "text") {
            setTextInputValue(filledValues[field.id] || "");
            setShowTextModal(true);
        } else if (field.type === "image") {
            fileInputRef.current?.click();
        } else if (field.type === "radio") {
            setFilledValues((prev) => ({
                ...prev,
                [field.id]: prev[field.id] === "true" ? "false" : "true",
            }));
        }
    };

    const handleTextSubmit = () => {
        if (activeFieldId && textInputValue.trim()) {
            setFilledValues((prev) => ({ ...prev, [activeFieldId]: textInputValue.trim() }));
        }
        setShowTextModal(false);
        setTextInputValue("");
        setActiveFieldId(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeFieldId) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setFilledValues((prev) => ({ ...prev, [activeFieldId]: base64 }));
            setActiveFieldId(null);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = "";
    };

    const handleSignatureSave = (signature: string) => {
        setSignatureImage(signature);
        if (activeFieldId) {
            setFilledValues((prev) => ({ ...prev, [activeFieldId]: "signed" }));
        }
        setShowSignaturePad(false);
        setActiveFieldId(null);
    };

    const handleSubmit = async () => {
        if (!documentId || !document) return;

        // Check if all required fields are filled
        const hasSignatureField = document.fields?.some((f) => f.type === "signature");
        if (hasSignatureField && !signatureImage) {
            alert("Please draw your signature before submitting.");
            return;
        }

        setSubmitting(true);

        try {
            // Prepare fields with filled values
            const fieldsWithValues = document.fields?.map((field) => ({
                ...field,
                value: filledValues[field.id] || field.value,
            }));

            const response = await fetch(`${API_BASE}/share/complete/${documentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fields: fieldsWithValues,
                    signatureImage,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to sign document");
            }

            setSuccess(true);
            setDownloadUrl(data.data.downloadUrl);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to sign document");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(`${API_BASE.replace("/api/v1", "")}${downloadUrl}`, "_blank");
        }
    };

    const onPageLoad = useCallback(({ width, height }: { width: number; height: number }) => {
        setPageDimensions({ width, height });
    }, []);

    // Get fields for current page
    const currentPageFields = document?.fields?.filter((f) => f.pageNumber === currentPage) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <Button onClick={() => navigate("/")}>Go Home</Button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Document Signed!</h2>
                    <p className="text-gray-500 mb-4">
                        The document has been signed successfully.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={handleDownload} className="gap-2">
                            <Download className="h-4 w-4" />
                            Download Signed PDF
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/")}>
                            Go Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Hidden file input for image upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{document?.filename}</span>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle className="h-4 w-4" />
                    )}
                    {submitting ? "Signing..." : "Complete Signing"}
                </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-sm text-blue-700">
                Click on the highlighted fields to fill in values. Click on signature fields to draw your signature.
            </div>

            {/* PDF Viewer with Fields */}
            <div className="flex justify-center py-6 px-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="relative">
                        <Document
                            file={document?.pdfUrl ? `${API_BASE.replace("/api/v1", "")}${document.pdfUrl}` : undefined}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            loading={<Loader2 className="h-8 w-8 animate-spin" />}
                        >
                            <Page
                                pageNumber={currentPage}
                                height={600}
                                onLoadSuccess={onPageLoad}
                            />
                        </Document>

                        {/* Field Overlays */}
                        {pageDimensions.width > 0 && currentPageFields.map((field) => {
                            const value = filledValues[field.id];
                            const isFilled = !!value;
                            const isSignature = field.type === "signature";
                            const isImage = field.type === "image";

                            return (
                                <div
                                    key={field.id}
                                    onClick={() => handleFieldClick(field)}
                                    className="absolute cursor-pointer transition-all hover:opacity-80 overflow-hidden"
                                    style={{
                                        left: field.x * pageDimensions.width,
                                        top: field.y * pageDimensions.height,
                                        width: field.width * pageDimensions.width,
                                        height: field.height * pageDimensions.height,
                                        backgroundColor: isFilled ? `${FIELD_COLORS[field.type]}10` : `${FIELD_COLORS[field.type]}20`,
                                        border: `2px solid ${FIELD_COLORS[field.type]}`,
                                        borderRadius: 4,
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 flex items-center justify-center text-xs font-medium overflow-hidden px-1"
                                        style={{ color: isFilled ? "#333" : FIELD_COLORS[field.type] }}
                                    >
                                        {isSignature && signatureImage ? (
                                            <img src={signatureImage} alt="Signature" className="max-h-full max-w-full object-contain" />
                                        ) : isImage && value?.startsWith("data:image") ? (
                                            <img src={value} alt="Uploaded" className="max-h-full max-w-full object-contain" />
                                        ) : isFilled && !isSignature && !isImage ? (
                                            <span className="truncate">{value}</span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                {isImage && <Upload className="h-3 w-3" />}
                                                {FIELD_LABELS[field.type]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {numPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {numPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                                disabled={currentPage === numPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input Modal */}
            {showTextModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Enter Text</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowTextModal(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        <input
                            type="text"
                            value={textInputValue}
                            onChange={(e) => setTextInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                            className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your text here..."
                            autoFocus
                        />
                        <div className="flex gap-3 justify-end mt-4">
                            <Button variant="outline" onClick={() => setShowTextModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleTextSubmit}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Pad Modal */}
            <SignaturePad
                isOpen={showSignaturePad}
                onClose={() => setShowSignaturePad(false)}
                onSave={handleSignatureSave}
            />
        </div>
    );
};

export default SignerView;
