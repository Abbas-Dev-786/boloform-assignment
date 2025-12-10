import { ArrowLeft, FileUp } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "../components/ui/shadcn-io/dropzone";
import useGlobalStore from "../store/global.store";
import PdfLayout from "../layouts/pdf-layout";
import { Button } from "../components/ui/button";

const Home = () => {
  const { file, fileUrl, setFile, setFileUrl, clearFile } = useGlobalStore();

  const handleDrop = (files: File[]) => {
    const droppedFile = files[0];
    if (!droppedFile) return;

    // Clean up previous URL if exists
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    const url = URL.createObjectURL(droppedFile);
    setFile(droppedFile);
    setFileUrl(url);
  };

  const handleBack = () => {
    clearFile();
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

            <Dropzone
              accept={{ "application/pdf": [] }}
              maxFiles={1}
              maxSize={1024 * 1024 * 100}
              minSize={1024}
              onDrop={handleDrop}
              onError={console.error}
              src={file ? [file] : undefined}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>

            <p className="text-xs text-center text-gray-400 mt-4">
              Accepts PDF files up to 100MB
            </p>
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
          </div>

          {/* PDF Editor */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <PdfLayout />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
