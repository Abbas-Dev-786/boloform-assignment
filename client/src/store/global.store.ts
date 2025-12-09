import { create } from "zustand";

export interface GlobalStore {
  file: File | undefined;
  fileUrl: string | undefined;
  setFile: (file: File) => void;
  setFileUrl: (fileUrl: string) => void;
}

const useGlobalStore = create<GlobalStore>((set) => ({
  file: undefined,
  fileUrl: undefined,
  setFile: (file: File) => set({ file }),
  setFileUrl: (fileUrl: string) => set({ fileUrl }),
}));

export default useGlobalStore;
