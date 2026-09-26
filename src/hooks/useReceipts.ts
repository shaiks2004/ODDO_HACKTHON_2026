import { useInventory } from '../context/InventoryContext';

export const useReceipts = () => {
  const {
    receipts,
    createReceipt,
    updateReceipt,
    cancelReceipt,
    validateReceipt,
    getReceiptById,
  } = useInventory();

  return {
    receipts,
    createReceipt,
    updateReceipt,
    cancelReceipt,
    validateReceipt,
    getReceiptById,
  };
};
