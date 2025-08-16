import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiCamera, 
  FiPackage, 
  FiBarChart2, 
  FiLayers, 
  FiBarChart, 
  FiMenu, 
  FiMoon, 
  FiSun, 
  FiX,
  FiShoppingBag
} from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ darkMode, toggleDarkMode, sidebarOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      description: 'Ana sayfa ve istatistikler'
    },
    {
      path: '/barkod-okuyucu',
      icon: FiCamera,
      label: 'Barkod Okuyucu',
      description: 'Barkod tarama ve arama'
    },
    {
      path: '/urun-yonetimi',
      icon: FiPackage,
      label: 'Ürün Yönetimi',
      description: 'Ürün ekleme ve düzenleme'
    },
    {
      path: '/stok-yonetimi',
      icon: FiBarChart2,
      label: 'Stok Yönetimi',
      description: 'Stok takibi ve güncelleme'
    },
    {
      path: '/kategori-yonetimi',
      icon: FiLayers,
      label: 'Kategori Yönetimi',
      description: 'Kategori işlemleri'
    },
    {
      path: '/raporlar',
      icon: FiBarChart,
      label: 'Raporlar',
      description: 'Detaylı raporlar ve analizler'
    }
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Menüyü aç/kapat"
            >
              <FiMenu size={20} />
            </button>
            
            <div className="navbar-brand">
              <div className="brand-icon">
                <FiShoppingBag size={24} />
              </div>
              <div className="brand-text">
                <h1>Barkod Sistemi</h1>
                <span>Stok Yönetimi</span>
              </div>
            </div>
          </div>
          
          <div className="navbar-right">
            <button 
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <FiShoppingBag size={32} className="brand-icon" />
            <div className="brand-info">
              <h2>S. Market</h2>
              <span>v1.0b</span>
            </div>
          </div>
          
          <button 
            className="sidebar-close"
            onClick={toggleSidebar}
            aria-label="Menüyü kapat"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => window.innerWidth <= 768 && toggleSidebar()}
                  >
                    <div className="nav-icon">
                      <Icon size={20} />
                    </div>
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                    {isActive && <div className="nav-indicator" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="footer-info">
            <p className="footer-text">© 2025 S. Market</p>
            <p className="footer-subtext">Tüm hakları saklıdır</p>
            <p className="footer-subtext">by Twix</p>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;