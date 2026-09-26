import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Skeleton, ToastHost, notify } from './components/ui'
import { authStorage } from './api/client'

const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const CatalogPage = lazy(() => import('./pages/CatalogPages').then((module) => ({ default: module.CatalogPage })))
const InventoryPage = lazy(() => import('./pages/CatalogPages').then((module) => ({ default: module.InventoryPage })))
const ProductDetailsPage = lazy(() => import('./pages/CatalogPages').then((module) => ({ default: module.ProductDetailsPage })))
const SettingsPage = lazy(() => import('./pages/CatalogPages').then((module) => ({ default: module.SettingsPage })))
const OperationsPage = lazy(() => import('./pages/OperationsPage').then((module) => ({ default: module.OperationsPage })))
const AlertsPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.AlertsPage })))
const MovementHistoryPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.MovementHistoryPage })))
const ReportsPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.ReportsPage })))

function RouteLoading({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loading"><Skeleton className="title-skeleton" /><div className="loading-rows"><Skeleton /><Skeleton /><Skeleton /></div></div>}>{children}</Suspense>
}

function NotFoundPage() {
  return <div className="not-found-page"><div className="not-found-number">404</div><h1>That page isn’t in this warehouse.</h1><p>The address may be outdated, or the page has moved.</p><Link to="/" className="button button-primary">Return to overview</Link></div>
}

function RouterContent() {
  const [authenticated, setAuthenticated] = useState(Boolean(authStorage.access()))
  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthenticated(false)
      notify('info', 'Your session ended. Sign in again to continue.')
    }
    window.addEventListener('stocksense:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('stocksense:unauthorized', handleUnauthorized)
  }, [])

  function logout() {
    authStorage.clear()
    setAuthenticated(false)
    notify('success', 'You have signed out.')
  }

  const signedIn = <AppShell onLogout={logout} />
  return <>
    <ToastHost />
    <Routes>
      <Route path="/login" element={authenticated ? <Navigate to="/" replace /> : <RouteLoading><AuthPage onAuthenticated={() => setAuthenticated(true)} /></RouteLoading>} />
      <Route path="/forgot-password" element={<RouteLoading><AuthPage onAuthenticated={() => setAuthenticated(true)} /></RouteLoading>} />
      <Route path="/reset-password" element={<RouteLoading><AuthPage onAuthenticated={() => setAuthenticated(true)} /></RouteLoading>} />
      <Route element={authenticated ? signedIn : <Navigate to="/login" replace />}>
        <Route index element={<RouteLoading><DashboardPage /></RouteLoading>} />
        <Route path="inventory" element={<RouteLoading><InventoryPage /></RouteLoading>} />
        <Route path="products" element={<RouteLoading><CatalogPage kind="products" /></RouteLoading>} />
        <Route path="products/:productId" element={<RouteLoading><ProductDetailsPage /></RouteLoading>} />
        <Route path="categories" element={<RouteLoading><CatalogPage kind="categories" /></RouteLoading>} />
        <Route path="warehouses" element={<RouteLoading><CatalogPage kind="warehouses" /></RouteLoading>} />
        <Route path="locations" element={<RouteLoading><CatalogPage kind="locations" /></RouteLoading>} />
        <Route path="receipts" element={<RouteLoading><OperationsPage kind="receipts" /></RouteLoading>} />
        <Route path="deliveries" element={<RouteLoading><OperationsPage kind="deliveries" /></RouteLoading>} />
        <Route path="transfers" element={<RouteLoading><OperationsPage kind="transfers" /></RouteLoading>} />
        <Route path="adjustments" element={<RouteLoading><OperationsPage kind="adjustments" /></RouteLoading>} />
        <Route path="movements" element={<RouteLoading><MovementHistoryPage /></RouteLoading>} />
        <Route path="alerts" element={<RouteLoading><AlertsPage /></RouteLoading>} />
        <Route path="reports" element={<RouteLoading><ReportsPage /></RouteLoading>} />
        <Route path="settings" element={<RouteLoading><SettingsPage /></RouteLoading>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </>
}

export default function App() {
  return <BrowserRouter><RouterContent /></BrowserRouter>
}