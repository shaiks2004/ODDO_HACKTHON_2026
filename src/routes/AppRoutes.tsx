import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AuthRedirect } from './AuthRedirect';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { StockPage } from '../pages/stock/StockPage';
import { WarehousePage } from '../pages/warehouse/WarehousePage';
import { LocationPage } from '../pages/location/LocationPage';
import { ReceiptsPage } from '../pages/receipts/ReceiptsPage';
import { NewReceiptPage } from '../pages/receipts/NewReceiptPage';
import { ReceiptDetailPage } from '../pages/receipts/ReceiptDetailPage';
import { DeliveryPage } from '../pages/delivery/DeliveryPage';
import { NewDeliveryPage } from '../pages/delivery/NewDeliveryPage';
import { DeliveryDetailPage } from '../pages/delivery/DeliveryDetailPage';
import { LedgerPage } from '../pages/ledger/LedgerPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Route: Authentication-first redirect */}
      <Route path="/" element={<AuthRedirect />} />

      {/* Public Authentication Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
      </Route>

      {/* Protected Enterprise Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Stock Availability */}
          <Route path="/stock" element={<StockPage />} />

          {/* Warehouse Management */}
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/warehouse/new" element={<WarehousePage />} />
          <Route path="/warehouse/:id" element={<WarehousePage />} />

          {/* Location Management */}
          <Route path="/location" element={<LocationPage />} />
          <Route path="/location/new" element={<LocationPage />} />
          <Route path="/location/:id" element={<LocationPage />} />

          {/* Inbound Receipts */}
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/receipts/new" element={<NewReceiptPage />} />
          <Route path="/receipts/:id" element={<ReceiptDetailPage />} />

          {/* Outbound Delivery */}
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/delivery/new" element={<NewDeliveryPage />} />
          <Route path="/delivery/:id" element={<DeliveryDetailPage />} />

          {/* Move History (Audit Ledger) */}
          <Route path="/move-history" element={<LedgerPage />} />

          {/* Settings & Profile */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Backwards-compatibility redirects */}
          <Route path="/products" element={<Navigate to="/stock" replace />} />
          <Route path="/products/*" element={<Navigate to="/stock" replace />} />
          <Route path="/deliveries" element={<Navigate to="/delivery" replace />} />
          <Route path="/deliveries/*" element={<Navigate to="/delivery" replace />} />
          <Route path="/warehouses" element={<Navigate to="/warehouse" replace />} />
          <Route path="/warehouses/*" element={<Navigate to="/warehouse" replace />} />
          <Route path="/transfers" element={<Navigate to="/move-history" replace />} />
          <Route path="/transfers/*" element={<Navigate to="/move-history" replace />} />
          <Route path="/adjustments" element={<Navigate to="/stock" replace />} />
        </Route>
      </Route>

      {/* Catch-all route routes back to AuthRedirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
