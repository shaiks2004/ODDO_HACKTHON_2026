import { useInventory } from '../context/InventoryContext';

export const useMovements = () => {
  const { moveHistory, exportMovementsCSV } = useInventory();

  return {
    movements: moveHistory,
    exportCSV: exportMovementsCSV,
  };
};
