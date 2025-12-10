import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, FileText, Eye, Edit, Download, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { auditApi, type AuditTrailResponse } from "../lib/api";

const ACTION_ICONS = {
    created: <Edit className="h-4 w-4 text-blue-500" />,
    viewed: <Eye className="h-4 w-4 text-gray-500" />,
    signed: <CheckCircle className="h-4 w-4 text-green-500" />,
    downloaded: <Download className="h-4 w-4 text-purple-500" />,
};

const ACTION_LABELS = {
    created: "Document Uploaded",
    viewed: "Document Viewed",
    signed: "Document Signed",
    downloaded: "Document Downloaded",
};

const AuditTrail = () => {
    const { documentId } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
    const [auditData, setAuditData] = useState<AuditTrailResponse["data"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<"verified" | "tampered" | null>(null);

    useEffect(() => {
        const loadAuditTrail = async () => {
            if (!documentId) return;

            try {
                setLoading(true);
                const response = await auditApi.getAuditTrail(documentId);
                setAuditData(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load audit trail");
            } finally {
                setLoading(false);
            }
        };

        loadAuditTrail();
    }, [documentId]);

    const handleVerify = async () => {
        if (!documentId) return;

        try {
            setVerifying(true);
            const result = await auditApi.verify(documentId);
            setVerificationResult(result.data.overallStatus);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading audit trail...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
                    <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <Button onClick={() => navigate("/documents")}>Back to Documents</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-3xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" onClick={() => navigate("/documents")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                {/* Document Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-gray-900">{auditData?.filename}</h1>
                            <p className="text-sm text-gray-500">
                                Status: <span className={auditData?.currentStatus === "signed" ? "text-green-600" : "text-yellow-600"}>
                                    {auditData?.currentStatus === "signed" ? "Signed" : "Pending"}
                                </span>
                            </p>
                        </div>
                        <Button onClick={handleVerify} disabled={verifying}>
                            <Shield className="h-4 w-4 mr-2" />
                            {verifying ? "Verifying..." : "Verify Integrity"}
                        </Button>
                    </div>

                    {/* Verification Result */}
                    {verificationResult && (
                        <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${verificationResult === "verified" ? "bg-green-50" : "bg-red-50"
                            }`}>
                            {verificationResult === "verified" ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-green-700 font-medium">Document integrity verified - No tampering detected</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-red-700 font-medium">Warning: Document may have been tampered with!</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Hashes */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Original Hash (SHA-256)</p>
                            <p className="text-xs font-mono text-gray-700 break-all">{auditData?.originalHash}</p>
                        </div>
                        {auditData?.signedHash && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Signed Hash (SHA-256)</p>
                                <p className="text-xs font-mono text-gray-700 break-all">{auditData?.signedHash}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Trail */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>

                    {auditData?.auditTrail.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No audit entries found</p>
                    ) : (
                        <div className="space-y-4">
                            {auditData?.auditTrail.map((entry, index) => (
                                <div key={entry.id} className="flex gap-4">
                                    {/* Timeline Line */}
                                    <div className="flex flex-col items-center">
                                        <div className="p-2 bg-gray-100 rounded-full">
                                            {ACTION_ICONS[entry.action]}
                                        </div>
                                        {index < (auditData?.auditTrail.length || 0) - 1 && (
                                            <div className="w-0.5 bg-gray-200 flex-1 mt-2" />
                                        )}
                                    </div>

                                    {/* Entry Content */}
                                    <div className="flex-1 pb-4">
                                        <p className="font-medium text-gray-900">{ACTION_LABELS[entry.action]}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </p>
                                        {entry.originalHash && (
                                            <p className="text-xs text-gray-400 mt-1 font-mono">
                                                Hash: {entry.originalHash.substring(0, 16)}...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
