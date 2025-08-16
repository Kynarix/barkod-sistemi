import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BarkodOkuyucu from './pages/BarkodOkuyucu';
import UrunYonetimi from './pages/UrunYonetimi';
import StokYonetimi from './pages/StokYonetimi';
import KategoriYonetimi from './pages/KategoriYonetimi';
import Raporlar from './pages/Raporlar';

import './App.css';
import './pages/Dashboard.css';
import './pages/BarkodOkuyucu.css';
import './pages/UrunYonetimi.css';
import './pages/StokYonetimi.css';
import './pages/KategoriYonetimi.css';
import './pages/Raporlar.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <Navbar 
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/barkod-okuyucu" element={<BarkodOkuyucu />} />
            <Route path="/urun-yonetimi" element={<UrunYonetimi />} />
            <Route path="/stok-yonetimi" element={<StokYonetimi />} />
            <Route path="/kategori-yonetimi" element={<KategoriYonetimi />} />
            <Route path="/raporlar" element={<Raporlar />} />
          </Routes>
        </div>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />
      </div>
    </Router>
  );
}

export default App;