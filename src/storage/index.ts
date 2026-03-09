import { DexieStorageProvider } from './dexieStorageProvider';
import type { ExpenseStorage } from './storageProvider';

export const storage: ExpenseStorage = new DexieStorageProvider();

export const clearAllData = async () => {
  if (storage instanceof DexieStorageProvider) {
    await storage.clearAllData();
    return;
  }

  throw new Error('Clear all data is only available for local storage.');
};

export type { ExpenseStorage } from './storageProvider';
