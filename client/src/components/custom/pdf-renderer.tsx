import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs"; // Ensure worker is loaded

import useGlobalStore from "../../store/global.store";

// Set worker source for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface PdfRendererProps {
    pageNumber: number;
    setNumPages: (numPages: number) => void;
}

const PdfRenderer = ({ pageNumber, setNumPages }: PdfRendererProps) => {
    const { fileUrl } = useGlobalStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [loading, setLoading] = useState(false);

    // Initialize Fabric Canvas
    useEffect(() => {
        if (canvasRef.current && !fabricCanvasRef.current) {
            fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
                selection: false,
            });
        }

        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, []);

    // Load and Render PDF Page
    useEffect(() => {
        const renderPdfPage = async () => {
            if (!fileUrl || !fabricCanvasRef.current) return;

            setLoading(true);
            try {
                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdf = await loadingTask.promise;
                setNumPages(pdf.numPages);

                const page = await pdf.getPage(pageNumber);

                // Scale: 1 for now, can be dynamic
                const scale = 1.0;
                const viewport = page.getViewport({ scale });

                // Create an offscreen canvas to render the PDF page
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;
                const context = offscreenCanvas.getContext("2d");

                if (context) {
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                        canvas: offscreenCanvas,
                    };

                    await page.render(renderContext).promise;

                    if (!fabricCanvasRef.current) return;

                    // Create a Fabric Image from the offscreen canvas
                    const bgImage = new fabric.Image(offscreenCanvas);

                    // Resize the main fabric canvas to match the page size
                    fabricCanvasRef.current.setWidth(viewport.width);
                    fabricCanvasRef.current.setHeight(viewport.height);

                    fabricCanvasRef.current.backgroundImage = bgImage;
                    fabricCanvasRef.current.renderAll();
                }
            } catch (error) {
                console.error("Error rendering PDF:", error);
            } finally {
                setLoading(false);
            }
        };

        renderPdfPage();
    }, [fileUrl, pageNumber, setNumPages]);

    return (
        <div className="relative border border-gray-300 shadow-md inline-block">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    Loading...
                </div>
            )}
            <div>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default PdfRenderer;