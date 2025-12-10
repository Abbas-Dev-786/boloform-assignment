import { useEffect } from "react";
import CustomPagination from "../components/custom/custom-pagination";
import ActionToolbar from "../components/custom/action-toolbar";
import PdfRenderer from "../components/custom/pdf-renderer";
import useGlobalStore from "../store/global.store";

const PdfLayout = () => {
  const {
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
  } = useGlobalStore();

  // Sync pagination state with global store
  const handleSetNumPages = (numPages: number) => {
    setTotalPages(numPages);
  };

  const handleSave = () => {
    const fields = useGlobalStore.getState().getAllFields();
    console.log("Saved fields:", JSON.stringify(fields, null, 2));
    // TODO: Send to backend
  };

  const handleSign = () => {
    // TODO: Open signature modal
    console.log("Sign document clicked");
  };

  // Reset page when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  const fieldCount = useGlobalStore((state) => state.getAllFields().length);

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <ActionToolbar onSave={handleSave} onSign={handleSign} />

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
        </div>
      )}
    </div>
  );
};

export default PdfLayout;
