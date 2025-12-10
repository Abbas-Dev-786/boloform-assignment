import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, FileUp, FolderOpen, Loader2 } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "../components/ui/shadcn-io/dropzone";
import useGlobalStore from "../store/global.store";
import PdfLayout from "../layouts/pdf-layout";
import { Button } from "../components/ui/button";
import { documentApi } from "../lib/api";

const Home = () => {
  const navigate = useNavigate();
  const { file, fileUrl, setFile, setFileUrl, clearFile } = useGlobalStore();
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile) return;

    // Clean up previous URL if exists
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    setError(null);
    setUploading(true);

    try {
      // Upload to backend
      const response = await documentApi.upload(droppedFile);
      const docId = response.data.id;
      setDocumentId(docId);

      // Store document ID in localStorage for document list
      const storedDocs = localStorage.getItem("documents");
      const docIds = storedDocs ? JSON.parse(storedDocs) : [];
      if (!docIds.includes(docId)) {
        docIds.unshift(docId);
        localStorage.setItem("documents", JSON.stringify(docIds));
      }

      // Set local state for editor
      const url = URL.createObjectURL(droppedFile);
      setFile(droppedFile);
      setFileUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    clearFile();
    setDocumentId(null);
    setError(null);
  };

  return (
    <div className="w-screen min-h-screen bg-gray-100 overflow-x-hidden">
      {!fileUrl ? (
        // Upload view
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="w-full max-w-md px-4">
            <div className="text-center mb-6">
              <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                PDF Signature Editor
              </h1>
              <p className="text-gray-500">
                Upload a PDF to add signature fields, text boxes, and more
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <Dropzone
              accept={{ "application/pdf": [] }}
              maxFiles={1}
              maxSize={1024 * 1024 * 100}
              minSize={1024}
              onDrop={handleDrop}
              onError={(err) => setError(err.message)}
              src={file ? [file] : undefined}
              disabled={uploading}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-gray-500">Uploading PDF...</p>
                </div>
              ) : (
                <>
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </>
              )}
            </Dropzone>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                Accepts PDF files up to 100MB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/documents")}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                My Documents
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Editor view
        <div className="flex flex-col min-h-screen">
          {/* Top bar */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {file?.name}
            </span>
            {documentId && (
              <span className="text-xs text-gray-400 ml-auto">
                ID: {documentId.substring(0, 8)}...
              </span>
            )}
          </div>

          {/* PDF Editor */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <PdfLayout documentId={documentId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
