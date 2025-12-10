import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import CustomPagination from "../components/custom/custom-pagination";
import ActionToolbar from "../components/custom/action-toolbar";
import PdfRenderer from "../components/custom/pdf-renderer";
import SignaturePad from "../components/custom/signature-pad";
import useGlobalStore from "../store/global.store";
import { documentApi, type FieldData } from "../lib/api";

interface PdfLayoutProps {
  documentId: string | null;
}

const PdfLayout = ({ documentId }: PdfLayoutProps) => {
  const navigate = useNavigate();
  const {
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    getAllFields,
    clearAllFields,
  } = useGlobalStore();

  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  // Sync pagination state with global store
  const handleSetNumPages = (numPages: number) => {
    setTotalPages(numPages);
  };

  const handleSave = () => {
    const fields = getAllFields();
    console.log("Saved fields:", JSON.stringify(fields, null, 2));
    alert(`${fields.length} field(s) saved locally. Click "Sign Document" to finalize.`);
  };

  const handleSign = () => {
    const fields = getAllFields();
    if (fields.length === 0) {
      alert("Please add at least one field before signing.");
      return;
    }

    // Check if there's a signature field
    const hasSignatureField = fields.some(f => f.type === "signature");
    if (hasSignatureField && !signatureImage) {
      setShowSignaturePad(true);
    } else {
      submitSignature(signatureImage || undefined);
    }
  };

  const handleSignatureApply = (signature: string) => {
    setSignatureImage(signature);
    setShowSignaturePad(false);
    submitSignature(signature);
  };

  const submitSignature = async (signature?: string) => {
    if (!documentId) {
      alert("No document ID found. Please re-upload the PDF.");
      return;
    }

    const fields = getAllFields();
    if (fields.length === 0) {
      alert("Please add at least one field before signing.");
      return;
    }

    setSigning(true);

    try {
      // Transform fields to API format
      const apiFields: FieldData[] = fields.map(f => ({
        id: f.id,
        type: f.type,
        pageNumber: f.pageNumber,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        value: f.value,
        required: f.required,
      }));

      const response = await documentApi.signPdf({
        documentId,
        fields: apiFields,
        signatureImage: signature,
      });

      alert(
        `Document signed successfully!\n\n` +
        `Original Hash: ${response.data.originalHash.substring(0, 16)}...\n` +
        `Signed Hash: ${response.data.signedHash.substring(0, 16)}...`
      );

      // Clear fields and navigate to documents
      clearAllFields();
      navigate("/documents");
    } catch (err) {
      alert(`Signing failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSigning(false);
    }
  };

  // Reset page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const fieldCount = useGlobalStore((state) => state.getAllFields().length);

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <ActionToolbar
        onSave={handleSave}
        onSign={handleSign}
        signing={signing}
      />

      <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow">
        <PdfRenderer
          pageNumber={currentPage}
          setNumPages={handleSetNumPages}
        />

        <CustomPagination
          pageNumber={currentPage}
          numPages={totalPages}
          setPageNumber={setCurrentPage}
        />
      </div>

      {/* Field count indicator */}
      {fieldCount > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {fieldCount} field(s) placed
          {signatureImage && " • Signature captured"}
        </div>
      )}

      {/* Signature Pad Modal */}
      <SignaturePad
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handleSignatureApply}
      />
    </div>
  );
};

export default PdfLayout;
