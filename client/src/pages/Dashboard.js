import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPackage, 
  FiTrendingDown, 
  FiDollarSign, 
  FiGrid,
  FiAlertTriangle,
  FiTrendingUp,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    toplam_urun: 0,
    dusuk_stok: 0,
    toplam_deger: 0,
    kategori_sayisi: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, productsRes, movementsRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/urunler'),
        axios.get('/api/stok-hareketleri')
      ]);
      
      setStats(statsRes.data);
      setRecentProducts(productsRes.data.slice(0, 5));
      setStockMovements(movementsRes.data.slice(0, 10));
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      toast.error('Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Veriler güncellendi');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'giris':
        return <FiTrendingUp className="text-success" />;
      case 'cikis':
        return <FiTrendingDown className="text-error" />;
      default:
        return <FiActivity className="text-info" />;
    }
  };

  const getMovementTypeText = (type) => {
    switch (type) {
      case 'giris':
        return 'Giriş';
      case 'cikis':
        return 'Çıkış';
      default:
        return 'Düzeltme';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Dashboard yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Stok yönetim sistemi genel görünümü</p>
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={refreshData}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? 'spinning' : ''} />
          Yenile
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiPackage size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.toplam_urun}</h3>
            <p className="stat-label">Toplam Ürün</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FiAlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.dusuk_stok}</h3>
            <p className="stat-label">Düşük Stok</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiDollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatCurrency(stats.toplam_deger)}</h3>
            <p className="stat-label">Toplam Değer</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <FiGrid size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.kategori_sayisi}</h3>
            <p className="stat-label">Kategori</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Son Eklenen Ürünler */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Son Eklenen Ürünler</h2>
              <p className="card-subtitle">En son sisteme eklenen ürünler</p>
            </div>
            <div className="card-body">
              {recentProducts.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Barkod</th>
                        <th>Ürün Adı</th>
                        <th>Kategori</th>
                        <th>Stok</th>
                        <th>Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <code className="barcode">{product.barkod}</code>
                          </td>
                          <td className="font-medium">{product.ad}</td>
                          <td>
                            <span className="badge badge-info">
                              {product.kategori_adi || 'Kategorisiz'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              product.stok_miktari <= product.min_stok && product.min_stok > 0
                                ? 'badge-warning'
                                : 'badge-success'
                            }`}>
                              {product.stok_miktari}
                            </span>
                          </td>
                          <td className="font-medium">
                            {formatCurrency(product.birim_fiyat)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <FiPackage size={48} className="empty-icon" />
                  <p>Henüz ürün eklenmemiş</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Son Stok Hareketleri */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Son Stok Hareketleri</h2>
              <p className="card-subtitle">En son gerçekleşen stok işlemleri</p>
            </div>
            <div className="card-body">
              {stockMovements.length > 0 ? (
                <div className="movements-list">
                  {stockMovements.map((movement) => (
                    <div key={movement.id} className="movement-item">
                      <div className="movement-icon">
                        {getMovementTypeIcon(movement.hareket_tipi)}
                      </div>
                      <div className="movement-content">
                        <div className="movement-header">
                          <h4 className="movement-product">{movement.urun_adi}</h4>
                          <span className="movement-time">
                            {formatDate(movement.tarih)}
                          </span>
                        </div>
                        <div className="movement-details">
                          <span className="movement-type">
                            {getMovementTypeText(movement.hareket_tipi)}
                          </span>
                          <span className="movement-amount">
                            {movement.miktar > 0 ? '+' : ''}{movement.miktar}
                          </span>
                          <span className="movement-stock">
                            Stok: {movement.yeni_stok}
                          </span>
                        </div>
                        {movement.aciklama && (
                          <p className="movement-description">{movement.aciklama}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiActivity size={48} className="empty-icon" />
                  <p>Henüz stok hareketi yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;