import { Document, Page } from "react-pdf";
import useGlobalStore from "../../store/global.store";


const PdfRenderer = ({ pageNumber, setNumPages }: { pageNumber: number, setNumPages: (numPages: number) => void }) => {
    const { fileUrl } = useGlobalStore();

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }


    return (
        <Document
            file={fileUrl}
            className={"border border-gray-300 shadow-md"}
            loading={<h1>Loading...</h1>}
            onLoadSuccess={onDocumentLoadSuccess}
        >
            <Page pageNumber={pageNumber} height={600} />
        </Document>
    )
}

export default PdfRenderer