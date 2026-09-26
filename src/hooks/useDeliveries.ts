import { useInventory } from '../context/InventoryContext';

export const useDeliveries = () => {
  const {
    deliveries,
    createDelivery,
    updateDelivery,
    cancelDelivery,
    validateDelivery,
    getDeliveryById,
  } = useInventory();

  return {
    deliveries,
    createDelivery,
    updateDelivery,
    cancelDelivery,
    validateDelivery,
    getDeliveryById,
  };
};
