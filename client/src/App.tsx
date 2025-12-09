import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "./components/ui/shadcn-io/dropzone";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const App = () => {
  const [file, setFile] = useState<File | undefined>();
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const handleDrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    console.log("Dropped file:", file);

    const url = URL.createObjectURL(file);
    console.log("File URL:", url);

    setFile(file);
    setFileUrl(url);
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
        <div className="flex flex-col items-center justify-center overflow-auto">
          <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow mb-10">
            <h1>Hello</h1>
          </div>
          <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow">
            <Document
              file={fileUrl}
              className={"border border-gray-300 shadow-md"}
              loading={<h1>Loading...</h1>}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} height={600} />
            </Document>

            <div className="flex items-center justify-around gap-10">
              <button
                onClick={() =>
                  setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1)
                }
              >
                Previous
              </button>
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <button
                onClick={() =>
                  setPageNumber(
                    pageNumber < (numPages || 1) ? pageNumber + 1 : numPages
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
