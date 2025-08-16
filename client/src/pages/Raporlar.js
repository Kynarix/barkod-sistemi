import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiDownload, 
  FiCalendar, 
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiDollarSign,
  FiAlertTriangle,
  FiBarChart,
  FiPieChart,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Raporlar = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    overview: {},
    lowStockProducts: [],
    topProducts: [],
    categoryStats: [],
    recentMovements: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, movementsRes, categoriesRes] = await Promise.all([
        axios.get('/api/dashboard-stats'),
        axios.get('/api/urunler'),
        axios.get('/api/stok-hareketleri'),
        axios.get('/api/kategoriler')
      ]);

      const products = productsRes.data;
      const movements = movementsRes.data;
      const categories = categoriesRes.data;

      // Filter movements by date range
      const filteredMovements = movements.filter(movement => {
        const movementDate = new Date(movement.tarih).toISOString().split('T')[0];
        return movementDate >= dateRange.startDate && movementDate <= dateRange.endDate;
      });

      // Calculate low stock products
      const lowStockProducts = products.filter(product => 
        product.min_stok > 0 && product.stok_miktari <= product.min_stok
      ).sort((a, b) => (a.stok_miktari / a.min_stok) - (b.stok_miktari / b.min_stok));

      // Calculate top products by stock value
      const topProducts = products
        .map(product => ({
          ...product,
          totalValue: (product.stok_miktari || 0) * (product.birim_fiyat || 0)
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Calculate category statistics
      const categoryStats = categories.map(category => {
        const categoryProducts = products.filter(p => p.kategori_id === category.id);
        const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stok_miktari || 0), 0);
        const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.stok_miktari || 0) * (p.birim_fiyat || 0)), 0);
        const categoryMovements = filteredMovements.filter(m => 
          categoryProducts.some(p => p.id === m.urun_id)
        );
        
        return {
          ...category,
          productCount: categoryProducts.length,
          totalStock,
          totalValue,
          movementCount: categoryMovements.length
        };
      }).sort((a, b) => b.totalValue - a.totalValue);

      setReportData({
        overview: statsRes.data,
        lowStockProducts,
        topProducts,
        categoryStats,
        recentMovements: filteredMovements.slice(0, 20)
      });
    } catch (error) {
      toast.error('Rapor verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportReport = () => {
    const reportContent = generateReportContent();
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stok-raporu-${dateRange.startDate}-${dateRange.endDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rapor başarıyla indirildi');
  };

  const generateReportContent = () => {
    const { overview, lowStockProducts, topProducts, categoryStats } = reportData;
    
    return `
STOK YÖNETİM SİSTEMİ RAPORU
============================
Tarih Aralığı: ${dateRange.startDate} - ${dateRange.endDate}
Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}

GENEL ÖZET
----------
Toplam Ürün: ${overview.totalProducts || 0}
Düşük Stok Ürün: ${overview.lowStockProducts || 0}
Toplam Stok Değeri: ${formatCurrency(overview.totalValue || 0)}
Toplam Kategori: ${overview.totalCategories || 0}

DÜŞÜK STOK ÜRÜNLERİ
-------------------
${lowStockProducts.map(product => 
  `${product.ad} (${product.barkod}) - Mevcut: ${product.stok_miktari}, Min: ${product.min_stok}`
).join('\n')}

EN DEĞERLI ÜRÜNLER
------------------
${topProducts.map(product => 
  `${product.ad} - Stok: ${product.stok_miktari}, Değer: ${formatCurrency(product.totalValue)}`
).join('\n')}

KATEGORİ İSTATİSTİKLERİ
-----------------------
${categoryStats.map(category => 
  `${category.ad} - Ürün: ${category.productCount}, Stok: ${category.totalStock}, Değer: ${formatCurrency(category.totalValue)}`
).join('\n')}
`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatusClass = (current, min) => {
    if (min > 0 && current <= min) {
      return current === 0 ? 'status-critical' : 'status-warning';
    }
    return 'status-normal';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Rapor verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Raporlar</h1>
          <p className="page-subtitle">Detaylı stok ve ürün raporları</p>
        </div>
        
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadReportData}>
            <FiRefreshCw />
            Yenile
          </button>
          <button className="btn btn-primary" onClick={exportReport}>
            <FiDownload />
            Rapor İndir
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Başlangıç Tarihi</label>
                <div className="input-group">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Bitiş Tarihi</label>
                <div className="input-group">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Rapor Türü</label>
                <div className="input-group">
                  <FiFilter className="input-icon" />
                  <select
                    className="form-select"
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                  >
                    <option value="overview">Genel Özet</option>
                    <option value="stock">Stok Durumu</option>
                    <option value="categories">Kategori Analizi</option>
                    <option value="movements">Stok Hareketleri</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="reports-content">
        {selectedReport === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiPackage />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{reportData.overview.totalProducts || 0}</h3>
                  <p className="stat-label">Toplam Ürün</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon warning">
                  <FiAlertTriangle />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{reportData.overview.lowStockProducts || 0}</h3>
                  <p className="stat-label">Düşük Stok</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon success">
                  <FiDollarSign />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{formatCurrency(reportData.overview.totalValue || 0)}</h3>
                  <p className="stat-label">Toplam Değer</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon info">
                  <FiBarChart />
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{reportData.overview.totalCategories || 0}</h3>
                  <p className="stat-label">Kategori</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'stock' && (
          <div className="stock-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Düşük Stok Ürünleri</h2>
                <span className="badge badge-warning">{reportData.lowStockProducts.length} ürün</span>
              </div>
              <div className="card-body p-0">
                {reportData.lowStockProducts.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ürün Adı</th>
                          <th>Barkod</th>
                          <th>Mevcut Stok</th>
                          <th>Min. Stok</th>
                          <th>Durum</th>
                          <th>Birim Fiyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.lowStockProducts.map((product) => (
                          <tr key={product.id}>
                            <td className="font-medium">{product.ad}</td>
                            <td>
                              <code className="barcode">{product.barkod}</code>
                            </td>
                            <td>{product.stok_miktari}</td>
                            <td>{product.min_stok}</td>
                            <td>
                              <span className={`status-badge ${getStockStatusClass(product.stok_miktari, product.min_stok)}`}>
                                {product.stok_miktari === 0 ? 'Kritik' : 'Düşük'}
                              </span>
                            </td>
                            <td>{formatCurrency(product.birim_fiyat)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiPackage size={48} className="empty-icon" />
                    <p>Düşük stoklu ürün bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'categories' && (
          <div className="categories-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Kategori Analizi</h2>
                <span className="badge badge-info">{reportData.categoryStats.length} kategori</span>
              </div>
              <div className="card-body p-0">
                {reportData.categoryStats.length > 0 ? (
                  <div className="categories-list">
                    {reportData.categoryStats.map((category) => (
                      <div key={category.id} className="category-report-item">
                        <div className="category-info">
                          <h3 className="category-name">{category.ad}</h3>
                          <p className="category-description">{category.aciklama}</p>
                        </div>
                        <div className="category-metrics">
                          <div className="metric">
                            <span className="metric-value">{category.productCount}</span>
                            <span className="metric-label">Ürün</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value">{category.totalStock}</span>
                            <span className="metric-label">Toplam Stok</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value">{formatCurrency(category.totalValue)}</span>
                            <span className="metric-label">Toplam Değer</span>
                          </div>
                          <div className="metric">
                            <span className="metric-value">{category.movementCount}</span>
                            <span className="metric-label">Hareket</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiPieChart size={48} className="empty-icon" />
                    <p>Kategori verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'movements' && (
          <div className="movements-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Son Stok Hareketleri</h2>
                <span className="badge badge-info">{reportData.recentMovements.length} hareket</span>
              </div>
              <div className="card-body p-0">
                {reportData.recentMovements.length > 0 ? (
                  <div className="movements-list">
                    {reportData.recentMovements.map((movement) => (
                      <div key={movement.id} className={`movement-item ${movement.tur === 'giris' ? 'movement-in' : 'movement-out'}`}>
                        <div className="movement-icon">
                          {movement.tur === 'giris' ? <FiTrendingUp /> : <FiTrendingDown />}
                        </div>
                        <div className="movement-info">
                          <div className="movement-header">
                            <span className="product-name">{movement.urun_adi}</span>
                            <span className="movement-amount">
                              {movement.tur === 'giris' ? '+' : '-'}{movement.miktar}
                            </span>
                          </div>
                          <div className="movement-details">
                            <span className="movement-date">{formatDate(movement.tarih)}</span>
                            {movement.aciklama && (
                              <span className="movement-description">{movement.aciklama}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiBarChart size={48} className="empty-icon" />
                    <p>Seçilen tarih aralığında hareket bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Raporlar;