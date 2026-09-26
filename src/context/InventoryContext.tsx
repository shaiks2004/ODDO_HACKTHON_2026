import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Product,
  Warehouse,
  Location,
  Receipt,
  Delivery,
  MoveHistoryEntry,
  UserProfile,
  UserSettings,
  ToastMessage,
  UnitOfMeasure,
} from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { stockService } from '../services/stock/stockService';
import { warehouseService } from '../services/warehouse/warehouseService';
import { locationService } from '../services/location/locationService';
import { receiptService } from '../services/receipts/receiptService';
import { deliveryService } from '../services/delivery/deliveryService';
import { movementService } from '../services/movements/movementService';
import { useAuth } from './AuthContext';
import { defaultMockProfile, defaultMockSettings } from '../data/mock/users';

interface InventoryContextType {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
  receipts: Receipt[];
  deliveries: Delivery[];
  moveHistory: MoveHistoryEntry[];
  settings: UserSettings;
  profile: UserProfile;
  isAuthenticated: boolean;
  toasts: ToastMessage[];

  // Auth bridges
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;

  // Toast
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;

  // Warehouse CRUD
  addWarehouse: (wh: Omit<Warehouse, 'id' | 'createdAt'>) => Promise<Warehouse>;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<Warehouse | undefined>;
  deleteWarehouse: (id: string) => Promise<boolean>;
  getWarehouseById: (id: string) => Warehouse | undefined;

  // Location CRUD
  addLocation: (loc: Omit<Location, 'id' | 'createdAt'>) => Promise<Location>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<Location | undefined>;
  deleteLocation: (id: string) => Promise<boolean>;
  getLocationById: (id: string) => Location | undefined;

  // Product / Stock CRUD
  addProduct: (prod: Omit<Product, 'id' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product | undefined>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProductById: (id: string) => Product | undefined;

  // Receipt Operations
  createReceipt: (rec: Omit<Receipt, 'id' | 'createdAt'>) => Promise<Receipt>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<Receipt | undefined>;
  cancelReceipt: (id: string) => Promise<Receipt | undefined>;
  validateReceipt: (id: string) => Promise<{ success: boolean; message?: string }>;
  getReceiptById: (id: string) => Receipt | undefined;

  // Delivery Operations
  createDelivery: (del: Omit<Delivery, 'id' | 'createdAt'>) => Promise<Delivery>;
  updateDelivery: (id: string, updates: Partial<Delivery>) => Promise<Delivery | undefined>;
  cancelDelivery: (id: string) => Promise<Delivery | undefined>;
  validateDelivery: (id: string) => Promise<{ success: boolean; message?: string }>;
  getDeliveryById: (id: string) => Delivery | undefined;

  // Internal Move / Transfer
  transferStock: (
    productId: string,
    fromWarehouse: string,
    fromLocation: string,
    toWarehouse: string,
    toLocation: string,
    quantity: number,
    notes?: string
  ) => Promise<{ success: boolean; message?: string }>;

  // Movements Export
  exportMovementsCSV: () => void;

  // Settings & Profile
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => void;

  // Reset demo data
  resetToDemoData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>([]);

  const [settings, setSettings] = useState<UserSettings>(() => {
    return storage.get<UserSettings>(STORAGE_KEYS.SETTINGS, defaultMockSettings);
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    return storage.get<UserProfile>(STORAGE_KEYS.PROFILE, defaultMockProfile);
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial data from services
  const refreshAllData = useCallback(async () => {
    try {
      const [whList, locList, prodList, recList, delList, movList] = await Promise.all([
        warehouseService.getWarehouses(),
        locationService.getLocations(),
        stockService.getProducts(),
        receiptService.getReceipts(),
        deliveryService.getDeliveries(),
        movementService.getMovements(),
      ]);

      setWarehouses(whList);
      setLocations(locList);
      setProducts(prodList);
      setReceipts(recList);
      setDeliveries(delList);
      setMoveHistory(movList);
    } catch {
      // In mock mode, services resolve from local storage/mock data safely
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Sync settings and profile updates to storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  // Toast Helpers
  const showToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth bridges
  const handleLogin = async (email: string, password?: string) => {
    const success = await auth.login({ email, password });
    if (success) {
      showToast('success', 'Authenticated Successfully', `Welcome back, ${email}`);
    } else {
      showToast('error', 'Login Failed', 'Please verify your credentials.');
    }
    return success;
  };

  const handleSignup = async (name: string, email: string, password?: string) => {
    const success = await auth.register({ name, email, password });
    if (success) {
      showToast('success', 'Account Created', `Welcome to StockSense, ${name}!`);
    } else {
      showToast('error', 'Registration Failed', 'Please try again.');
    }
    return success;
  };

  const handleLogout = () => {
    auth.logout();
    showToast('info', 'Logged Out', 'Your session has ended.');
  };

  // Warehouse CRUD
  const addWarehouse = async (wh: Omit<Warehouse, 'id' | 'createdAt'>): Promise<Warehouse> => {
    const created = await warehouseService.createWarehouse(wh);
    setWarehouses((prev) => [...prev, created]);
    showToast('success', 'Warehouse Created', `${created.name} (${created.shortCode}) has been registered.`);
    return created;
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    const updated = await warehouseService.updateWarehouse(id, updates);
    setWarehouses((prev) => prev.map((w) => (w.id === id ? updated : w)));
    showToast('success', 'Warehouse Updated', `Changes to ${updated.name} have been saved.`);
    return updated;
  };

  const deleteWarehouse = async (id: string) => {
    const wh = warehouses.find((w) => w.id === id);
    const success = await warehouseService.deleteWarehouse(id);
    if (success) {
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      showToast('info', 'Warehouse Deleted', `${wh?.name || 'Warehouse'} has been removed.`);
    }
    return success;
  };

  const getWarehouseById = (id: string) => warehouses.find((w) => w.id === id);

  // Location CRUD
  const addLocation = async (loc: Omit<Location, 'id' | 'createdAt'>): Promise<Location> => {
    const created = await locationService.createLocation(loc);
    setLocations((prev) => [...prev, created]);
    showToast('success', 'Location Created', `${created.name} in ${created.warehouseName} registered.`);
    return created;
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    const updated = await locationService.updateLocation(id, updates);
    setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
    showToast('success', 'Location Updated', `${updated.name} updated.`);
    return updated;
  };

  const deleteLocation = async (id: string) => {
    const loc = locations.find((l) => l.id === id);
    const success = await locationService.deleteLocation(id);
    if (success) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      showToast('info', 'Location Deleted', `${loc?.name || 'Location'} removed.`);
    }
    return success;
  };

  const getLocationById = (id: string) => locations.find((l) => l.id === id);

  // Product CRUD
  const addProduct = async (prod: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> => {
    const created = await stockService.createProduct(prod);
    setProducts((prev) => [...prev, created]);
    showToast('success', 'Product Registered', `${created.name} (${created.sku}) added to stock catalog.`);
    return created;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updated = await stockService.updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    showToast('success', 'Product Updated', `${updated.name} saved.`);
    return updated;
  };

  const deleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    const success = await stockService.deleteProduct(id);
    if (success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('info', 'Product Deleted', `${prod?.name || 'Product'} removed from catalog.`);
    }
    return success;
  };

  const getProductById = (id: string) => products.find((p) => p.id === id);

  // Receipt Operations
  const createReceipt = async (rec: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> => {
    const created = await receiptService.createReceipt(rec);
    setReceipts((prev) => [created, ...prev]);
    showToast('success', 'Receipt Draft Created', `Receipt ${created.reference} logged.`);
    return created;
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    const updated = await receiptService.updateReceipt(id, updates);
    setReceipts((prev) => prev.map((r) => (r.id === id ? updated : r)));
    showToast('success', 'Receipt Updated', `Receipt ${updated.reference} updated.`);
    return updated;
  };

  const cancelReceipt = async (id: string) => {
    const updated = await receiptService.cancelReceipt(id);
    setReceipts((prev) => prev.map((r) => (r.id === id ? updated : r)));
    showToast('warning', 'Receipt Canceled', `Receipt ${updated.reference} marked as canceled.`);
    return updated;
  };

  const validateReceipt = async (id: string) => {
    const res = await receiptService.validateReceipt(id);
    if (res.success) {
      await refreshAllData();
      showToast('success', 'Receipt Validated', res.message);
    } else {
      showToast('error', 'Validation Failed', res.message);
    }
    return res;
  };

  const getReceiptById = (id: string) => receipts.find((r) => r.id === id);

  // Delivery Operations
  const createDelivery = async (del: Omit<Delivery, 'id' | 'createdAt'>): Promise<Delivery> => {
    const created = await deliveryService.createDelivery(del);
    setDeliveries((prev) => [created, ...prev]);
    showToast('success', 'Delivery Order Created', `Order ${created.reference} logged.`);
    return created;
  };

  const updateDelivery = async (id: string, updates: Partial<Delivery>) => {
    const updated = await deliveryService.updateDelivery(id, updates);
    setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
    showToast('success', 'Delivery Updated', `Order ${updated.reference} updated.`);
    return updated;
  };

  const cancelDelivery = async (id: string) => {
    const updated = await deliveryService.cancelDelivery(id);
    setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
    showToast('warning', 'Delivery Canceled', `Order ${updated.reference} marked as canceled.`);
    return updated;
  };

  const validateDelivery = async (id: string) => {
    const res = await deliveryService.validateDelivery(id);
    if (res.success) {
      await refreshAllData();
      showToast('success', 'Delivery Dispatched', res.message);
    } else {
      showToast('error', 'Validation Failed', res.message);
    }
    return res;
  };

  const getDeliveryById = (id: string) => deliveries.find((d) => d.id === id);

  // Internal Move / Transfer
  const transferStock = async (
    productId: string,
    fromWarehouse: string,
    fromLocation: string,
    toWarehouse: string,
    toLocation: string,
    quantity: number,
    notes?: string
  ) => {
    const res = await stockService.transferStock({
      productId,
      fromWarehouse,
      fromLocation,
      toWarehouse,
      toLocation,
      quantity,
      notes,
    });

    if (res.success) {
      // Record internal transfer movement
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        await movementService.createMovement({
          reference: `WH/INT/000${Math.floor(10 + Math.random() * 90)}`,
          date: new Date().toLocaleDateString('en-GB'),
          operation: 'Internal Transfer',
          product: prod.name,
          productId: prod.id,
          from: `${fromWarehouse} / ${fromLocation}`,
          to: `${toWarehouse} / ${toLocation}`,
          quantity,
          unit: prod.unit,
          status: 'Done',
          user: profile.name,
        });
      }

      await refreshAllData();
      showToast('success', 'Internal Move Executed', res.message);
    } else {
      showToast('error', 'Move Failed', res.message);
    }
    return res;
  };

  // Movements Export
  const exportMovementsCSV = () => {
    movementService.exportCSV(moveHistory);
    showToast('info', 'Ledger Exported', 'Move history CSV has been downloaded.');
  };

  // Settings & Profile
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
    showToast('success', 'Settings Saved', 'System preferences updated.');
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      return updated;
    });
    showToast('success', 'Profile Saved', 'Personal information updated.');
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    storage.clearAllDemoData();
    stockService.reset();
    warehouseService.reset();
    locationService.reset();
    receiptService.reset();
    deliveryService.reset();
    movementService.reset();
    setSettings(defaultMockSettings);
    setProfile(defaultMockProfile);
    refreshAllData();
    showToast('info', 'Demo Data Reset', 'Prototype demo data has been restored to factory state.');
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        warehouses,
        locations,
        receipts,
        deliveries,
        moveHistory,
        settings,
        profile,
        isAuthenticated: auth.isAuthenticated,
        toasts,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        showToast,
        dismissToast,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        getWarehouseById,
        addLocation,
        updateLocation,
        deleteLocation,
        getLocationById,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        createReceipt,
        updateReceipt,
        cancelReceipt,
        validateReceipt,
        getReceiptById,
        createDelivery,
        updateDelivery,
        cancelDelivery,
        validateDelivery,
        getDeliveryById,
        transferStock,
        exportMovementsCSV,
        updateSettings,
        updateProfile,
        resetToDemoData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
