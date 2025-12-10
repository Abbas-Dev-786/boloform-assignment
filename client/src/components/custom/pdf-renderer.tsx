import { useCallback, useRef, useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import useGlobalStore from "../../store/global.store";
import FieldCanvas from "./field-canvas";

interface PdfRendererProps {
    pageNumber: number;
    setNumPages: (numPages: number) => void;
}

// Fixed PDF height for consistent rendering
const PDF_HEIGHT = 600;

const PdfRenderer = ({ pageNumber, setNumPages }: PdfRendererProps) => {
    const { fileUrl, setPdfDimensions } = useGlobalStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
    const [isPageReady, setIsPageReady] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
        setIsPageReady(false);
    }

    const onPageLoadSuccess = useCallback(
        (page: { width: number; height: number }) => {
            // Use requestAnimationFrame to get accurate dimensions after render
            requestAnimationFrame(() => {
                const pageElement = containerRef.current?.querySelector(".react-pdf__Page");
                if (pageElement) {
                    const rect = pageElement.getBoundingClientRect();
                    setPageDimensions({ width: rect.width, height: rect.height });
                    setPdfDimensions({
                        width: rect.width,
                        height: rect.height,
                        scale: rect.height / page.height,
                    });
                    setIsPageReady(true);
                }
            });
        },
        [setPdfDimensions]
    );

    // Handle responsive resize - recalculate dimensions when window resizes
    useEffect(() => {
        const handleResize = () => {
            if (!isPageReady) return;

            const pageElement = containerRef.current?.querySelector(".react-pdf__Page");
            if (pageElement) {
                const rect = pageElement.getBoundingClientRect();
                setPageDimensions({ width: rect.width, height: rect.height });
            }
        };

        // Debounce resize handler to prevent excessive updates
        let timeoutId: ReturnType<typeof setTimeout>;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 150);
        };

        window.addEventListener("resize", debouncedResize);
        return () => {
            window.removeEventListener("resize", debouncedResize);
            clearTimeout(timeoutId);
        };
    }, [isPageReady]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <Document
                file={fileUrl}
                className="border border-gray-300 shadow-md"
                loading={
                    <div className="flex items-center justify-center h-[600px] w-[450px] bg-gray-100">
                        <div className="text-gray-500">Loading PDF...</div>
                    </div>
                }
                onLoadSuccess={onDocumentLoadSuccess}
            >
                <Page
                    pageNumber={pageNumber}
                    height={PDF_HEIGHT}
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                />
            </Document>

            {/* fabric.js canvas overlay for fields */}
            {isPageReady && pageDimensions.width > 0 && pageDimensions.height > 0 && (
                <FieldCanvas
                    width={pageDimensions.width}
                    height={pageDimensions.height}
                    pageNumber={pageNumber}
                />
            )}
        </div>
    );
};

export default PdfRenderer;