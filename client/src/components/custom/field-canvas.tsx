import { useEffect, useRef, useCallback } from "react";
import { Canvas, Rect, IText, FabricObject } from "fabric";
import useGlobalStore from "../../store/global.store";
import {
    generateFieldId,
    pixelToNormalized,
    normalizedToPixel,
} from "../../types/field-types";
import type { FieldData, FieldType } from "../../types/field-types";

// Field colors by type
const FIELD_COLORS: Record<FieldType, { fill: string; stroke: string }> = {
    text: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3b82f6" },
    signature: { fill: "rgba(34, 197, 94, 0.2)", stroke: "#22c55e" },
    image: { fill: "rgba(168, 85, 247, 0.2)", stroke: "#a855f7" },
    date: { fill: "rgba(249, 115, 22, 0.2)", stroke: "#f97316" },
    radio: { fill: "rgba(236, 72, 153, 0.2)", stroke: "#ec4899" },
};

// Field labels
const FIELD_LABELS: Record<FieldType, string> = {
    text: "Text",
    signature: "Signature",
    image: "Image",
    date: "Date",
    radio: "Radio",
};

// Default field sizes (normalized)
const DEFAULT_FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
    text: { width: 0.2, height: 0.04 },
    signature: { width: 0.2, height: 0.08 },
    image: { width: 0.15, height: 0.12 },
    date: { width: 0.15, height: 0.04 },
    radio: { width: 0.03, height: 0.03 },
};

interface FieldCanvasProps {
    width: number;
    height: number;
    pageNumber: number;
}

// Extend FabricObject to include our custom fieldId property
interface FieldFabricObject extends FabricObject {
    fieldId?: string;
    fieldType?: FieldType;
}

const FieldCanvas = ({ width, height, pageNumber }: FieldCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);

    // Subscribe to reactive state
    const currentTool = useGlobalStore((state) => state.currentTool);
    const isSigningMode = useGlobalStore((state) => state.isSigningMode);
    const fields = useGlobalStore((state) => state.fields);

    const setCurrentTool = useGlobalStore((state) => state.setCurrentTool);
    const addField = useGlobalStore((state) => state.addField);
    const updateField = useGlobalStore((state) => state.updateField);
    const removeField = useGlobalStore((state) => state.removeField);
    const setSelectedFieldId = useGlobalStore((state) => state.setSelectedFieldId);

    // Get fields for current page (reactive)
    const pageFields = fields.get(pageNumber) || [];

    // Create a field rectangle on canvas
    const createFieldRect = useCallback(
        (field: FieldData, canvasWidth: number, canvasHeight: number) => {
            const pixelPos = normalizedToPixel(
                field.x,
                field.y,
                field.width,
                field.height,
                canvasWidth,
                canvasHeight
            );

            const colors = FIELD_COLORS[field.type];
            const rect = new Rect({
                left: pixelPos.x,
                top: pixelPos.y,
                width: pixelPos.width,
                height: pixelPos.height,
                fill: colors.fill,
                stroke: colors.stroke,
                strokeWidth: 2,
                cornerColor: colors.stroke,
                cornerStrokeColor: "#ffffff",
                cornerSize: 8,
                transparentCorners: false,
                lockRotation: true,
                hasRotatingPoint: false,
            });

            (rect as FieldFabricObject).fieldId = field.id;
            (rect as FieldFabricObject).fieldType = field.type;

            return rect;
        },
        []
    );

    // Create label text for field
    const createFieldLabel = useCallback(
        (field: FieldData, canvasWidth: number, canvasHeight: number) => {
            const pixelPos = normalizedToPixel(
                field.x,
                field.y,
                field.width,
                field.height,
                canvasWidth,
                canvasHeight
            );

            const colors = FIELD_COLORS[field.type];
            const text = new IText(FIELD_LABELS[field.type], {
                left: pixelPos.x + 4,
                top: pixelPos.y + 4,
                fontSize: 12,
                fill: colors.stroke,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: "500",
                selectable: false,
                evented: false,
            });

            (text as FieldFabricObject).fieldId = field.id;

            return text;
        },
        []
    );

    // Initialize fabric canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width,
            height,
            selection: !isSigningMode,
            backgroundColor: "transparent",
        });

        fabricRef.current = canvas;

        // Handle object selection
        canvas.on("selection:created", (e) => {
            const selected = e.selected?.[0] as FieldFabricObject;
            if (selected?.fieldId) {
                setSelectedFieldId(selected.fieldId);
            }
        });

        canvas.on("selection:cleared", () => {
            setSelectedFieldId(null);
        });

        // Handle object modification (move/resize)
        canvas.on("object:modified", (e) => {
            const obj = e.target as FieldFabricObject;
            if (!obj?.fieldId) return;

            const scaleX = obj.scaleX || 1;
            const scaleY = obj.scaleY || 1;
            const objWidth = (obj.width || 0) * scaleX;
            const objHeight = (obj.height || 0) * scaleY;

            const normalized = pixelToNormalized(
                obj.left || 0,
                obj.top || 0,
                objWidth,
                objHeight,
                width,
                height
            );

            updateField(obj.fieldId, {
                x: normalized.x,
                y: normalized.y,
                width: normalized.width,
                height: normalized.height,
            });

            obj.set({
                scaleX: 1,
                scaleY: 1,
                width: objWidth,
                height: objHeight,
            });
        });

        // Handle keyboard delete
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === "Delete" || e.key === "Backspace") && !isSigningMode) {
                const activeObject = canvas.getActiveObject() as FieldFabricObject;
                if (activeObject?.fieldId) {
                    removeField(activeObject.fieldId);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            canvas.dispose();
            fabricRef.current = null;
        };
    }, [width, height, isSigningMode, setSelectedFieldId, updateField, removeField]);

    // Render fields when pageFields change
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.clear();

        for (const field of pageFields) {
            const rect = createFieldRect(field, width, height);
            const label = createFieldLabel(field, width, height);
            canvas.add(rect);
            canvas.add(label);
        }

        canvas.renderAll();
    }, [pageFields, width, height, createFieldRect, createFieldLabel]);

    // Handle click on container to add new field
    const handleContainerClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!currentTool || isSigningMode) return;

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            console.log("Adding field at:", x, y, "Tool:", currentTool);

            const defaultSize = DEFAULT_FIELD_SIZES[currentTool];
            const normalized = pixelToNormalized(
                x,
                y,
                defaultSize.width * width,
                defaultSize.height * height,
                width,
                height
            );

            const boundedX = Math.min(normalized.x, 1 - normalized.width);
            const boundedY = Math.min(normalized.y, 1 - normalized.height);

            const newField: FieldData = {
                id: generateFieldId(),
                type: currentTool,
                pageNumber,
                x: Math.max(0, boundedX),
                y: Math.max(0, boundedY),
                width: normalized.width,
                height: normalized.height,
                required: true,
            };

            addField(newField);
            setCurrentTool(null);
        },
        [currentTool, isSigningMode, pageNumber, width, height, addField, setCurrentTool]
    );

    return (
        <div
            ref={containerRef}
            onClick={handleContainerClick}
            className="absolute top-0 left-0 z-10"
            style={{
                width,
                height,
                cursor: currentTool ? "crosshair" : "default",
                pointerEvents: isSigningMode ? "none" : "auto",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ pointerEvents: "none" }}
            />
        </div>
    );
};

export default FieldCanvas;
