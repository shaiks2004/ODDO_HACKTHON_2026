import { useInventory } from '../context/InventoryContext';

export const useLocations = () => {
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocationById,
  } = useInventory();

  return {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocationById,
  };
};
