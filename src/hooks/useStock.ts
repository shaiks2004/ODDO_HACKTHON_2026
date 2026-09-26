import { useInventory } from '../context/InventoryContext';

export const useStock = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    transferStock,
  } = useInventory();

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    transferStock,
  };
};
