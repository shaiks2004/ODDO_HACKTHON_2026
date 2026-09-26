import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { MoveHistoryEntry } from '../../types/movement';
import { mockMovements } from '../../data/mock/movements';

export const movementService = {
  async getMovements(): Promise<MoveHistoryEntry[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<MoveHistoryEntry[]>('/movements');
    }
    return storage.get<MoveHistoryEntry[]>(STORAGE_KEYS.MOVEMENTS, mockMovements);
  },

  async createMovement(entry: Omit<MoveHistoryEntry, 'id'>): Promise<MoveHistoryEntry> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<MoveHistoryEntry>('/movements', entry);
    }
    const list = storage.get<MoveHistoryEntry[]>(STORAGE_KEYS.MOVEMENTS, mockMovements);
    const newEntry: MoveHistoryEntry = {
      ...entry,
      id: `mov-${Date.now()}`,
    };
    const updated = [newEntry, ...list];
    storage.set(STORAGE_KEYS.MOVEMENTS, updated);
    return newEntry;
  },

  exportCSV(movements: MoveHistoryEntry[]): void {
    const headers = ['Reference,Date,Operation,Product,From,To,Quantity,Unit,Status,User'];
    const rows = movements.map(
      (m) =>
        `"${m.reference}","${m.date}","${m.operation}","${m.product}","${m.from}","${m.to}",${m.quantity},"${m.unit}","${m.status}","${m.user || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_move_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  reset(): void {
    storage.set(STORAGE_KEYS.MOVEMENTS, mockMovements);
  },
};
