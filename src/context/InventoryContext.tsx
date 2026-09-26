import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  OperationStatus,
} from '../types/inventory';
import {
  initialProducts,
  initialWarehouses,
  initialLocations,
  initialReceipts,
  initialDeliveries,
  initialMoveHistory,
  defaultProfile,
  defaultSettings,
} from '../data/mockData';

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

  // Auth
  login: (email: string, password?: string) => boolean;
  signup: (name: string, email: string, password?: string) => boolean;
  logout: () => void;

  // Toast
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;

  // Warehouse CRUD
  addWarehouse: (wh: Omit<Warehouse, 'id' | 'createdAt'>) => Warehouse;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => boolean;
  getWarehouseById: (id: string) => Warehouse | undefined;

  // Location CRUD
  addLocation: (loc: Omit<Location, 'id' | 'createdAt'>) => Location;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => boolean;
  getLocationById: (id: string) => Location | undefined;

  // Product / Stock CRUD
  addProduct: (prod: Omit<Product, 'id' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  getProductById: (id: string) => Product | undefined;

  // Receipt Operations
  createReceipt: (rec: Omit<Receipt, 'id' | 'createdAt'>) => Receipt;
  updateReceipt: (id: string, updates: Partial<Receipt>) => void;
  cancelReceipt: (id: string) => void;
  validateReceipt: (id: string) => { success: boolean; message?: string };
  getReceiptById: (id: string) => Receipt | undefined;

  // Delivery Operations
  createDelivery: (del: Omit<Delivery, 'id' | 'createdAt'>) => Delivery;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  cancelDelivery: (id: string) => void;
  validateDelivery: (id: string) => { success: boolean; message?: string };
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
  ) => { success: boolean; message?: string };

  // Settings & Profile
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => void;

  // Reset
  resetToDemoData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'stocksense_products_v2',
  WAREHOUSES: 'stocksense_warehouses_v2',
  LOCATIONS: 'stocksense_locations_v2',
  RECEIPTS: 'stocksense_receipts_v2',
  DELIVERIES: 'stocksense_deliveries_v2',
  MOVE_HISTORY: 'stocksense_move_history_v2',
  SETTINGS: 'stocksense_settings_v2',
  PROFILE: 'stocksense_profile_v2',
  AUTH: 'stocksense_auth_v2',
};

function formatDisplayDate(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return saved ? JSON.parse(saved) : initialLocations;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return saved ? JSON.parse(saved) : initialReceipts;
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return saved ? JSON.parse(saved) : initialDeliveries;
  });

  const [moveHistory, setMoveHistory] = useState<MoveHistoryEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVE_HISTORY);
    return saved ? JSON.parse(saved) : initialMoveHistory;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved !== null ? JSON.parse(saved) : true; // Default logged in for prototype convenience
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVE_HISTORY, JSON.stringify(moveHistory));
  }, [moveHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Toast Helpers
  const showToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Operations
  const login = (email: string, _password?: string) => {
    setIsAuthenticated(true);
    setProfile((prev) => ({
      ...prev,
      email: email || prev.email,
    }));
    showToast('success', 'Logged In', `Welcome back to StockSense`);
    return true;
  };

  const signup = (name: string, email: string, _password?: string) => {
    setIsAuthenticated(true);
    setProfile({
      name,
      email,
      role: 'Inventory Specialist',
      department: 'Logistics',
      assignedWarehouse: 'Main Warehouse',
    });
    showToast('success', 'Account Created', `Welcome to StockSense, ${name}`);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    showToast('info', 'Logged Out', 'You have been logged out.');
  };

  // Warehouse Operations
  const addWarehouse = (whData: Omit<Warehouse, 'id' | 'createdAt'>): Warehouse => {
    const newId = `wh-${Date.now().toString(36)}`;
    const newWh: Warehouse = {
      ...whData,
      id: newId,
      createdAt: formatDisplayDate(),
    };
    setWarehouses((prev) => [...prev, newWh]);
    showToast('success', 'Warehouse Added', `${newWh.name} (${newWh.shortCode}) created.`);
    return newWh;
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses((prev) =>
      prev.map((wh) => (wh.id === id ? { ...wh, ...updates } : wh))
    );
    showToast('success', 'Warehouse Updated', 'Changes saved successfully.');
  };

  const deleteWarehouse = (id: string): boolean => {
    // Check if locations or products depend on it
    const wh = warehouses.find((w) => w.id === id);
    if (!wh) return false;

    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    // Also remove locations belonging to this warehouse
    setLocations((prev) => prev.filter((loc) => loc.warehouseId !== id && loc.warehouseName !== wh.name));
    showToast('info', 'Warehouse Removed', `${wh.name} has been removed.`);
    return true;
  };

  const getWarehouseById = (id: string) => warehouses.find((w) => w.id === id);

  // Location Operations
  const addLocation = (locData: Omit<Location, 'id' | 'createdAt'>): Location => {
    const newId = `loc-${Date.now().toString(36)}`;
    const newLoc: Location = {
      ...locData,
      id: newId,
      createdAt: formatDisplayDate(),
    };
    setLocations((prev) => [...prev, newLoc]);
    showToast('success', 'Location Created', `${newLoc.name} (${newLoc.shortCode}) added to ${newLoc.warehouseName}.`);
    return newLoc;
  };

  const updateLocation = (id: string, updates: Partial<Location>) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
    );
    showToast('success', 'Location Updated', 'Changes saved successfully.');
  };

  const deleteLocation = (id: string): boolean => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return false;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    showToast('info', 'Location Removed', `${loc.name} has been removed.`);
    return true;
  };

  const getLocationById = (id: string) => locations.find((l) => l.id === id);

  // Product / Stock Operations
  const addProduct = (prodData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const newId = `prod-${Date.now().toString(36)}`;
    const newProd: Product = {
      ...prodData,
      id: newId,
      updatedAt: formatDisplayDate(),
    };
    setProducts((prev) => [...prev, newProd]);
    showToast('success', 'Product Created', `${newProd.name} (${newProd.sku}) added to inventory stock.`);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: formatDisplayDate() };
        // If currentStock or onHand is updated, ensure freeToUse is recalculating
        if (updates.onHand !== undefined || updates.reserved !== undefined) {
          const onHand = updates.onHand !== undefined ? updates.onHand : p.onHand;
          const reserved = updates.reserved !== undefined ? updates.reserved : p.reserved;
          updated.freeToUse = Math.max(0, onHand - reserved);
          updated.currentStock = onHand;
        }
        return updated;
      })
    );
    showToast('success', 'Stock Updated', 'Product stock record updated.');
  };

  const deleteProduct = (id: string): boolean => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return false;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('info', 'Product Removed', `${prod.name} removed from stock.`);
    return true;
  };

  const getProductById = (id: string) => products.find((p) => p.id === id || p.sku === id);

  // Receipt Operations
  const createReceipt = (recData: Omit<Receipt, 'id' | 'createdAt'>): Receipt => {
    const newId = `rec-${Date.now().toString(36)}`;
    const newRec: Receipt = {
      ...recData,
      id: newId,
      createdAt: formatDisplayDate(),
    };
    setReceipts((prev) => [newRec, ...prev]);
    showToast('success', 'Receipt Created', `Receipt ${newRec.reference} recorded.`);

    // If saved as Done directly:
    if (newRec.status === 'Done') {
      executeReceiptValidation(newRec);
    }
    return newRec;
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    showToast('success', 'Receipt Updated', 'Receipt details updated.');
  };

  const cancelReceipt = (id: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Canceled' } : r))
    );
    showToast('info', 'Receipt Canceled', 'The receipt was marked as canceled.');
  };

  const executeReceiptValidation = (receipt: Receipt) => {
    // 1. Current Stock + Received Quantity = New Stock
    const updatedProducts = [...products];
    const newMoveEntries: MoveHistoryEntry[] = [];

    receipt.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId || p.name === item.productName || p.sku === item.sku);
      if (idx >= 0) {
        const p = updatedProducts[idx];
        const newOnHand = p.onHand + item.quantity;
        const newFreeToUse = Math.max(0, newOnHand - p.reserved);

        updatedProducts[idx] = {
          ...p,
          currentStock: newOnHand,
          onHand: newOnHand,
          freeToUse: newFreeToUse,
          updatedAt: formatDisplayDate(),
        };

        newMoveEntries.push({
          id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
          reference: receipt.reference,
          date: receipt.scheduleDate || formatDisplayDate(),
          operation: 'Receipt',
          product: p.name,
          productId: p.id,
          from: receipt.supplier,
          to: receipt.warehouseName,
          quantity: item.quantity,
          unit: item.unit,
          status: 'Done',
          user: profile.name,
        });
      }
    });

    setProducts(updatedProducts);
    setMoveHistory((prev) => [...newMoveEntries, ...prev]);
  };

  const validateReceipt = (id: string): { success: boolean; message?: string } => {
    const receipt = receipts.find((r) => r.id === id);
    if (!receipt) return { success: false, message: 'Receipt not found.' };
    if (receipt.status === 'Done') return { success: false, message: 'Receipt is already validated.' };

    // Update status to Done
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Done' } : r))
    );

    executeReceiptValidation(receipt);
    showToast('success', 'Receipt Validated', `${receipt.reference} verified. Stock increased.`);
    return { success: true };
  };

  const getReceiptById = (id: string) => receipts.find((r) => r.id === id || r.reference === id);

  // Delivery Operations
  const createDelivery = (delData: Omit<Delivery, 'id' | 'createdAt'>): Delivery => {
    const newId = `del-${Date.now().toString(36)}`;
    const newDel: Delivery = {
      ...delData,
      id: newId,
      createdAt: formatDisplayDate(),
    };
    setDeliveries((prev) => [newDel, ...prev]);
    showToast('success', 'Delivery Order Created', `Order ${newDel.reference} scheduled.`);

    if (newDel.status === 'Done') {
      executeDeliveryValidation(newDel);
    }
    return newDel;
  };

  const updateDelivery = (id: string, updates: Partial<Delivery>) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    showToast('success', 'Delivery Updated', 'Delivery order updated.');
  };

  const cancelDelivery = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Canceled' } : d))
    );
    showToast('info', 'Delivery Canceled', 'The delivery order was marked as canceled.');
  };

  const executeDeliveryValidation = (delivery: Delivery): boolean => {
    // Check stock first: If requested quantity > available stock, DO NOT ALLOW VALIDATION
    for (const item of delivery.items) {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName || p.sku === item.sku);
      if (prod && item.quantity > prod.onHand) {
        showToast('error', 'Validation Failed', `Insufficient stock for ${prod.name}. Requested: ${item.quantity}, Available: ${prod.onHand}`);
        return false;
      }
    }

    const updatedProducts = [...products];
    const newMoveEntries: MoveHistoryEntry[] = [];

    delivery.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId || p.name === item.productName || p.sku === item.sku);
      if (idx >= 0) {
        const p = updatedProducts[idx];
        const newOnHand = Math.max(0, p.onHand - item.quantity);
        const newFreeToUse = Math.max(0, newOnHand - p.reserved);

        updatedProducts[idx] = {
          ...p,
          currentStock: newOnHand,
          onHand: newOnHand,
          freeToUse: newFreeToUse,
          updatedAt: formatDisplayDate(),
        };

        newMoveEntries.push({
          id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
          reference: delivery.reference,
          date: delivery.scheduleDate || formatDisplayDate(),
          operation: 'Delivery',
          product: p.name,
          productId: p.id,
          from: delivery.warehouseName,
          to: delivery.customer,
          quantity: item.quantity,
          unit: item.unit,
          status: 'Done',
          user: profile.name,
        });
      }
    });

    setProducts(updatedProducts);
    setMoveHistory((prev) => [...newMoveEntries, ...prev]);
    return true;
  };

  const validateDelivery = (id: string): { success: boolean; message?: string } => {
    const delivery = deliveries.find((d) => d.id === id);
    if (!delivery) return { success: false, message: 'Delivery not found.' };
    if (delivery.status === 'Done') return { success: false, message: 'Delivery is already validated.' };

    // Check stock availability
    for (const item of delivery.items) {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName || p.sku === item.sku);
      if (prod && item.quantity > prod.onHand) {
        const msg = `Insufficient stock available for this delivery. Required: ${item.quantity} ${item.unit}, On Hand: ${prod.onHand} ${prod.unit}`;
        showToast('error', 'Cannot Validate Delivery', msg);
        return { success: false, message: msg };
      }
    }

    // Perform validation
    const success = executeDeliveryValidation(delivery);
    if (!success) {
      return { success: false, message: 'Validation could not be completed.' };
    }

    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Done' } : d))
    );

    showToast('success', 'Delivery Validated', `${delivery.reference} shipped. Stock deducted.`);
    return { success: true };
  };

  const getDeliveryById = (id: string) => deliveries.find((d) => d.id === id || d.reference === id);

  // Internal Stock Transfer
  const transferStock = (
    productId: string,
    fromWarehouse: string,
    fromLocation: string,
    toWarehouse: string,
    toLocation: string,
    quantity: number,
    notes?: string
  ): { success: boolean; message?: string } => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, message: 'Product not found.' };

    if (quantity > prod.onHand) {
      const msg = `Insufficient stock for internal transfer. Available: ${prod.onHand} ${prod.unit}`;
      showToast('error', 'Transfer Failed', msg);
      return { success: false, message: msg };
    }

    // Total stock remains unchanged! Location allocation changes.
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              warehouseName: toWarehouse,
              locationName: toLocation,
              updatedAt: formatDisplayDate(),
            }
          : p
      )
    );

    const ref = `WH/INT/${Math.floor(1000 + Math.random() * 9000)}`;

    const newMove: MoveHistoryEntry = {
      id: `mov-${Date.now().toString(36)}`,
      reference: ref,
      date: formatDisplayDate(),
      operation: 'Internal Transfer',
      product: prod.name,
      productId: prod.id,
      from: `${fromWarehouse} (${fromLocation})`,
      to: `${toWarehouse} (${toLocation})`,
      quantity,
      unit: prod.unit,
      status: 'Done',
      user: profile.name,
    };

    setMoveHistory((prev) => [newMove, ...prev]);
    showToast(
      'success',
      'Stock Transferred',
      `${quantity} ${prod.unit} of ${prod.name} moved to ${toWarehouse} (${toLocation}). Total stock unchanged.`
    );

    return { success: true };
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('success', 'Settings Saved', 'Preferences updated.');
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
    showToast('success', 'Profile Updated', 'User profile information updated.');
  };

  const resetToDemoData = () => {
    setWarehouses(initialWarehouses);
    setLocations(initialLocations);
    setProducts(initialProducts);
    setReceipts(initialReceipts);
    setDeliveries(initialDeliveries);
    setMoveHistory(initialMoveHistory);
    setSettings(defaultSettings);
    setProfile(defaultProfile);
    setIsAuthenticated(true);
    showToast('info', 'Demo Data Reset', 'StockSense demo inventory has been restored.');
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
        isAuthenticated,
        toasts,
        login,
        signup,
        logout,
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
        updateSettings,
        updateProfile,
        resetToDemoData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
