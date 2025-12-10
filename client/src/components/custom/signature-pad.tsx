import { useRef, useEffect, useState } from "react";
import { Canvas, PencilBrush } from "fabric";
import { Button } from "../ui/button";
import { X, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureDataUrl: string) => void;
}

const SignaturePad = ({ isOpen, onClose, onSave }: SignaturePadProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: 500,
            height: 200,
            backgroundColor: "#ffffff",
            isDrawingMode: true,
        });

        // Configure brush
        const brush = new PencilBrush(canvas);
        brush.color = "#000000";
        brush.width = 2;
        canvas.freeDrawingBrush = brush;

        // Track if canvas has content
        canvas.on("path:created", () => {
            setIsEmpty(false);
        });

        fabricRef.current = canvas;

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, [isOpen]);

    const handleClear = () => {
        const canvas = fabricRef.current;
        if (canvas) {
            canvas.clear();
            canvas.backgroundColor = "#ffffff";
            canvas.renderAll();
            setIsEmpty(true);
        }
    };

    const handleSave = () => {
        const canvas = fabricRef.current;
        if (!canvas || isEmpty) return;

        // Export as PNG with transparent background for better overlay
        const dataUrl = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 2, // Higher resolution
        });

        onSave(dataUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Draw Your Signature
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                {/* Canvas */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden mb-4">
                    <canvas ref={canvasRef} className="w-full" />
                </div>

                {/* Instructions */}
                <p className="text-sm text-gray-500 mb-4">
                    Use your mouse or finger to draw your signature above
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={handleClear} className="gap-2">
                        <RotateCcw size={18} />
                        Clear
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isEmpty}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Check size={18} />
                        Apply Signature
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
