import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "./components/ui/shadcn-io/dropzone";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const App = () => {
  const [file, setFile] = useState<File | undefined>();
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [numPages, setNumPages] = useState<number>(0);

  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    console.log("Dropped file:", file);

    const url = URL.createObjectURL(file);
    console.log("File URL:", url);

    setFile(file);
    setFileUrl(url);
  };

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
      {!fileUrl ? (
        <div className="size-120">
          <h1 className="text-center mb-2 font-semibold text-2xl">
            Upload your pdf file here
          </h1>
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
        </div>
      ) : (
        <div className="size-120 flex flex-col items-center justify-center overflow-auto bg-white p-4 rounded shadow">
          <Document file={fileUrl} onLoadSuccess={handleLoadSuccess}>
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={500} // adjust / make responsive as you like
              />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};

export default App;
