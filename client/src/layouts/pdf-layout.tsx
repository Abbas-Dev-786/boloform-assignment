import { useState } from "react";
import CustomPagination from "../components/custom/custom-pagination";
import ActionToolbar from "../components/custom/action-toolbar";
import PdfRenderer from "../components/custom/pdf-renderer";

const PdfLayout = () => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);


  return (
    <div className="flex flex-col items-center justify-center overflow-auto">
      <ActionToolbar />

      <div className="bg-white p-4 flex flex-col gap-4 rounded-lg shadow">
        <PdfRenderer pageNumber={pageNumber} setNumPages={setNumPages} />

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
