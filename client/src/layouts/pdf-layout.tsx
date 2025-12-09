import { Document, Page } from "react-pdf";
import useGlobalStore from "../store/global.store";
import { useState } from "react";
import CustomPagination from "../components/custom/custom-pagination";
import ActionToolbar from "../components/custom/action-toolbar";

const PdfLayout = () => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { fileUrl } = useGlobalStore();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center justify-center overflow-auto">
      <ActionToolbar />

      <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow">
        <Document
          file={fileUrl}
          className={"border border-gray-300 shadow-md"}
          loading={<h1>Loading...</h1>}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={pageNumber} height={600} />
        </Document>

        <CustomPagination
          pageNumber={pageNumber}
          numPages={numPages}
          setPageNumber={setPageNumber}
        />
      </div>
    </div>
  );
};

export default PdfLayout;
