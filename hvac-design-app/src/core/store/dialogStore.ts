import { create } from 'zustand';

interface DialogState {
  openCalculationSettings: boolean;
  openBulkEdit: boolean;
  openSystemTemplate: boolean;
  setOpenCalculationSettings: (open: boolean) => void;
  setOpenBulkEdit: (open: boolean) => void;
  setOpenSystemTemplate: (open: boolean) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  openCalculationSettings: false,
  openBulkEdit: false,
  openSystemTemplate: false,
  setOpenCalculationSettings: (open) => set({ openCalculationSettings: open }),
  setOpenBulkEdit: (open) => set({ openBulkEdit: open }),
  setOpenSystemTemplate: (open) => set({ openSystemTemplate: open }),
}));
