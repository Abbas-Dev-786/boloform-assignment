import { create } from "zustand";
import type { FieldData, FieldType, PDFDimensions } from "../types/field-types";

export interface GlobalStore {
  // File state
  file: File | undefined;
  fileUrl: string | undefined;
  setFile: (file: File) => void;
  setFileUrl: (fileUrl: string) => void;
  clearFile: () => void;

  // PDF dimensions (for coordinate normalization)
  pdfDimensions: PDFDimensions | undefined;
  setPdfDimensions: (dimensions: PDFDimensions) => void;

  // Current page being viewed
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;

  // Currently selected tool
  currentTool: FieldType | null;
  setCurrentTool: (tool: FieldType | null) => void;

  // Fields per page: Map<pageNumber, FieldData[]>
  fields: Map<number, FieldData[]>;
  addField: (field: FieldData) => void;
  updateField: (fieldId: string, updates: Partial<FieldData>) => void;
  removeField: (fieldId: string) => void;
  getFieldsForPage: (pageNumber: number) => FieldData[];
  getAllFields: () => FieldData[];
  clearAllFields: () => void;

  // Selected field for editing
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;

  // Signing mode
  isSigningMode: boolean;
  setSigningMode: (mode: boolean) => void;
}

const useGlobalStore = create<GlobalStore>((set, get) => ({
  // File state
  file: undefined,
  fileUrl: undefined,
  setFile: (file: File) => set({ file }),
  setFileUrl: (fileUrl: string) => set({ fileUrl }),
  clearFile: () => {
    const currentUrl = get().fileUrl;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl); // Clean up memory
    }
    set({
      file: undefined,
      fileUrl: undefined,
      fields: new Map(),
      currentPage: 1,
      totalPages: 1,
      pdfDimensions: undefined,
    });
  },

  // PDF dimensions
  pdfDimensions: undefined,
  setPdfDimensions: (dimensions: PDFDimensions) =>
    set({ pdfDimensions: dimensions }),

  // Page navigation
  currentPage: 1,
  totalPages: 1,
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setTotalPages: (total: number) => set({ totalPages: total }),

  // Tool selection
  currentTool: null,
  setCurrentTool: (tool: FieldType | null) => set({ currentTool: tool }),

  // Fields management
  fields: new Map(),

  addField: (field: FieldData) =>
    set((state) => {
      const newFields = new Map(state.fields);
      const pageFields = newFields.get(field.pageNumber) || [];
      newFields.set(field.pageNumber, [...pageFields, field]);
      return { fields: newFields };
    }),

  updateField: (fieldId: string, updates: Partial<FieldData>) =>
    set((state) => {
      const newFields = new Map(state.fields);
      for (const [pageNum, pageFields] of newFields) {
        const fieldIndex = pageFields.findIndex((f) => f.id === fieldId);
        if (fieldIndex !== -1) {
          const updatedFields = [...pageFields];
          updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
          newFields.set(pageNum, updatedFields);
          break;
        }
      }
      return { fields: newFields };
    }),

  removeField: (fieldId: string) =>
    set((state) => {
      const newFields = new Map(state.fields);
      for (const [pageNum, pageFields] of newFields) {
        const filtered = pageFields.filter((f) => f.id !== fieldId);
        if (filtered.length !== pageFields.length) {
          newFields.set(pageNum, filtered);
          break;
        }
      }
      return { fields: newFields };
    }),

  getFieldsForPage: (pageNumber: number) => {
    return get().fields.get(pageNumber) || [];
  },

  getAllFields: () => {
    const allFields: FieldData[] = [];
    for (const pageFields of get().fields.values()) {
      allFields.push(...pageFields);
    }
    return allFields;
  },

  clearAllFields: () => set({ fields: new Map() }),

  // Selected field
  selectedFieldId: null,
  setSelectedFieldId: (id: string | null) => set({ selectedFieldId: id }),

  // Signing mode
  isSigningMode: false,
  setSigningMode: (mode: boolean) => set({ isSigningMode: mode }),
}));

export default useGlobalStore;