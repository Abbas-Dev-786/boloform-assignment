import { create } from "zustand";
import * as fabric from "fabric";

export interface GlobalStore {
  file: File | undefined;
  fileUrl: string | undefined;
  fabricCanvas: fabric.Canvas | null;
  setFile: (file: File) => void;
  setFileUrl: (fileUrl: string) => void;
  setFabricCanvas: (canvas: fabric.Canvas | null) => void;
}

const useGlobalStore = create<GlobalStore>((set) => ({
  file: undefined,
  fileUrl: undefined,
  fabricCanvas: null,
  setFile: (file: File) => set({ file }),
  setFileUrl: (fileUrl: string) => set({ fileUrl }),
  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),
}));

export default useGlobalStore;
