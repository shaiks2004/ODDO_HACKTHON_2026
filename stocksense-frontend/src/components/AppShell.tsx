import { useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeftRight, Boxes, ChevronDown, Command,
  Grid2X2, History, MapPin, Menu, Package, PackageCheck, PackageOpen,
  Search, Settings, Warehouse as WarehouseIcon, X, Wrench,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { authStorage } from '../api/client'
import { IconButton } from './ui'

const sections = [
  {
    title: 'Workspace',
    links: [
      { to: '/', label: 'Overview', icon: Grid2X2, end: true },
      { to: '/inventory', label: 'Inventory', icon: Boxes },
      { to: '/products', label: 'Products', icon: Package },
      { to: '/categories', label: 'Categories', icon: PackageOpen },
      { to: '/warehouses', label: 'Warehouses', icon: WarehouseIcon },
      { to: '/locations', label: 'Locations', icon: MapPin },
    ],
  },
  {
    title: 'Operations',
    links: [
      { to: '/receipts', label: 'Receipts', icon: PackageCheck },
      { to: '/deliveries', label: 'Deliveries', icon: PackageOpen },
      { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
      { to: '/adjustments', label: 'Adjustments', icon: Wrench },
    ],
  },
  {
    title: 'Insights',
    links: [
      { to: '/movements', label: 'Movement history', icon: History },
      { to: '/reports', label: 'Reports', icon: Activity },
      { to: '/alerts', label: 'Low-stock alerts', icon: AlertTriangle },
    ],
  },
]

const titles: Record<string, string> = {
  '/': 'Overview', '/inventory': 'Inventory', '/products': 'Products', '/categories': 'Categories',
  '/warehouses': 'Warehouses', '/locations': 'Locations', '/receipts': 'Receipts',
  '/deliveries': 'Deliveries', '/transfers': 'Internal transfers', '/adjustments': 'Adjustments',
  '/movements': 'Movement history', '/alerts': 'Low-stock alerts', '/reports': 'Reports', '/settings': 'Settings',
}

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const email = authStorage.email()
  const title = location.pathname.startsWith('/products/') ? 'Product details' : titles[location.pathname] ?? 'StockSense'

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(`/inventory${query ? `?search=${encodeURIComponent(query)}` : ''}`)
    setDrawerOpen(false)
  }

  return <div className={`app-frame ${drawerOpen ? 'drawer-open' : ''}`}>
    {drawerOpen && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-symbol"><Boxes size={20} strokeWidth={2.2} /></div><span className="brand-name">Stock<span>Sense</span></span><IconButton label="Close navigation" className="mobile-close" onClick={() => setDrawerOpen(false)}><X size={19} /></IconButton></div>
      <div className="workspace-chip"><span className="workspace-dot" /> Main workspace <ChevronDown size={14} /></div>
      <nav className="side-nav" aria-label="Main navigation">
        {sections.map((section) => <div className="nav-section" key={section.title}>
          <div className="nav-label">{section.title}</div>
          {section.links.map(({ to, label, icon: Icon, ...options }) => <NavLink key={to} to={to} end={'end' in options ? options.end : false} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Low-stock alerts' && <span className="nav-spark" />}
          </NavLink>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}><Settings size={18} strokeWidth={1.8} /><span>Settings</span></NavLink>
        <div className="sidebar-user"><div className="avatar avatar-small">{email.slice(0, 1).toUpperCase() || 'S'}</div><div className="sidebar-user-copy"><strong>{email.split('@')[0] || 'StockSense user'}</strong><span>Inventory workspace</span></div><button className="user-menu-trigger" aria-label="Sign out" title="Sign out" onClick={onLogout}><ChevronDown size={16} /></button></div>
      </div>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-left"><IconButton label="Open navigation" className="mobile-menu" onClick={() => setDrawerOpen(true)}><Menu size={20} /></IconButton><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div></div>
        <div className="topbar-actions">
          <form className="global-search" onSubmit={handleSearch}><Search size={16} /><input aria-label="Search inventory" placeholder="Search products, SKU..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd><Command size={11} /> K</kbd></form>
          <button className="top-alert-button" aria-label="View low-stock alerts" title="Low-stock alerts" onClick={() => navigate('/alerts')}><AlertTriangle size={18} /><i /></button>
          <div className="topbar-divider" />
          <button className="top-user" onClick={onLogout} title="Sign out"><div className="avatar">{email.slice(0, 1).toUpperCase() || 'S'}</div><span>{email.split('@')[0] || 'Account'}</span><ChevronDown size={14} /></button>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="app-footer"><span>StockSense inventory</span><span><span className="online-dot" /> API-connected workspace</span></footer>
    </div>
  </div>
}