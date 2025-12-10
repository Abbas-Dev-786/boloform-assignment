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
    const { fileUrl, setFabricCanvas } = useGlobalStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [loading, setLoading] = useState(false);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // Measure container width
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    // We use contentBoxSize to get the width without padding/border if box-sizing is content-box,
                    // but technically clientWidth or contentRect.width is often safer for "available space".
                    // entry.contentRect.width is strictly the content area.
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Initialize Fabric Canvas
    useEffect(() => {
        if (canvasRef.current && !fabricCanvasRef.current) {
            fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
                selection: false,
            });
            setFabricCanvas(fabricCanvasRef.current);
        }

        return () => {
            if (fabricCanvasRef.current) {
                setFabricCanvas(null);
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, [setFabricCanvas]);

    // Load and Render PDF Page
    useEffect(() => {
        const renderPdfPage = async () => {
            if (!fileUrl || !fabricCanvasRef.current || containerWidth === 0) return;

            setLoading(true);
            try {
                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdf = await loadingTask.promise;
                setNumPages(pdf.numPages);

                const page = await pdf.getPage(pageNumber);

                // Calculate scale to fit container width
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const scale = containerWidth / unscaledViewport.width;
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

        // Debounce slightly if needed, or rely on React batching.
        // Real-time resizing might be heavy, but let's try direct first.
        const timeoutId = setTimeout(() => {
            renderPdfPage();
        }, 100);

        return () => clearTimeout(timeoutId);

    }, [fileUrl, pageNumber, setNumPages, containerWidth]);

    return (
        <div ref={containerRef} className="relative w-full border border-gray-300 shadow-md inline-block">
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