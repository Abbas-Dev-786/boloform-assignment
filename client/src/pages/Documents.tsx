import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Clock, CheckCircle, Download, Shield, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { documentApi, auditApi, type DocumentResponse } from "../lib/api";

const Documents = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For demo purposes, we'll store documents in localStorage
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                setLoading(true);
                const storedDocs = localStorage.getItem("documents");
                if (storedDocs) {
                    const docIds = JSON.parse(storedDocs) as string[];
                    const docs = await Promise.all(
                        docIds.map(async (id) => {
                            try {
                                const response = await documentApi.get(id);
                                return response.data;
                            } catch {
                                return null;
                            }
                        })
                    );
                    setDocuments(docs.filter((d): d is DocumentResponse => d !== null));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load documents");
            } finally {
                setLoading(false);
            }
        };

        loadDocuments();
    }, []);

    const handleVerify = async (documentId: string) => {
        try {
            const result = await auditApi.verify(documentId);
            alert(
                `Document Integrity: ${result.data.overallStatus.toUpperCase()}\n` +
                `Original: ${result.data.verification.originalDocument.intact ? "✅ Intact" : "❌ Tampered"}`
            );
        } catch (err) {
            alert(`Verification failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    const handleDownload = (documentId: string) => {
        window.open(documentApi.getDownloadUrl(documentId), "_blank");
    };

    const handleViewAudit = (documentId: string) => {
        navigate(`/audit/${documentId}`);
    };

    const handleDelete = (documentId: string) => {
        const storedDocs = localStorage.getItem("documents");
        if (storedDocs) {
            const docIds = JSON.parse(storedDocs) as string[];
            const filtered = docIds.filter((id) => id !== documentId);
            localStorage.setItem("documents", JSON.stringify(filtered));
            setDocuments(documents.filter((d) => d.id !== documentId));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading documents...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
                    <Button onClick={() => navigate("/")}>
                        Upload New PDF
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {documents.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h2 className="text-xl font-medium text-gray-900 mb-2">No documents yet</h2>
                        <p className="text-gray-500 mb-4">Upload a PDF to get started</p>
                        <Button onClick={() => navigate("/")}>Upload PDF</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
                            >
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-gray-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{doc.filename}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="h-4 w-4" />
                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                        {doc.status === "signed" ? (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Signed
                                            </span>
                                        ) : (
                                            <span className="text-yellow-600">Pending</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewAudit(doc.id)}
                                        title="View Audit Trail"
                                    >
                                        <Shield className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVerify(doc.id)}
                                        title="Verify Integrity"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    {doc.status === "signed" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(doc.id)}
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(doc.id)}
                                        title="Remove"
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
