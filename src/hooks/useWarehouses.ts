import { useInventory } from '../context/InventoryContext';

export const useWarehouses = () => {
  const {
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById,
  } = useInventory();

  return {
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById,
  };
};
