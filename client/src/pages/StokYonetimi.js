import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPlus, 
  FiMinus, 
  FiSearch, 
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiCalendar,
  FiUser,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const StokYonetimi = () => {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockData, setStockData] = useState({
    miktar: '',
    tur: 'giris',
    aciklama: ''
  });
  const [movementFilter, setMovementFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, movementsRes] = await Promise.all([
        axios.get('/api/urunler'),
        axios.get('/api/stok-hareketleri')
      ]);
      setProducts(productsRes.data);
      setStockMovements(movementsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockData({
      miktar: '',
      tur: 'giris',
      aciklama: ''
    });
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    
    if (!stockData.miktar || stockData.miktar <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    try {
      await axios.post('/api/stok-guncelle-id', {
        urun_id: selectedProduct.id,
        miktar: parseInt(stockData.miktar),
        tur: stockData.tur,
        aciklama: stockData.aciklama
      });
      
      toast.success('Stok başarıyla güncellendi');
      await loadData();
      closeStockModal();
    } catch (error) {
      toast.error('Stok güncellenirken hata oluştu');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredProducts = products.filter(product => 
    product.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barkod.includes(searchTerm)
  );

  const filteredMovements = stockMovements.filter(movement => {
    const matchesType = movementFilter === 'all' || movement.tur === movementFilter;
    const matchesDate = !dateFilter || movement.tarih.startsWith(dateFilter);
    return matchesType && matchesDate;
  });

  const getStockStatus = (current, min) => {
    if (min > 0 && current <= min) {
      return { class: 'badge-warning', text: 'Düşük Stok', icon: FiTrendingDown };
    } else if (current === 0) {
      return { class: 'badge-error', text: 'Stok Yok', icon: FiMinus };
    } else {
      return { class: 'badge-success', text: 'Normal', icon: FiTrendingUp };
    }
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

  const getMovementIcon = (type) => {
    return type === 'giris' ? FiTrendingUp : FiTrendingDown;
  };

  const getMovementClass = (type) => {
    return type === 'giris' ? 'movement-in' : 'movement-out';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Stok verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="stock-management">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Stok Yönetimi</h1>
          <p className="page-subtitle">Stok takibi ve hareket yönetimi</p>
        </div>
        
        <button className="btn btn-primary" onClick={loadData}>
          <FiRefreshCw />
          Yenile
        </button>
      </div>

      <div className="stock-grid">
        {/* Products Section */}
        <div className="products-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ürün Stokları</h2>
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body p-0">
              {filteredProducts.length > 0 ? (
                <div className="products-list">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stok_miktari, product.min_stok);
                    const StatusIcon = stockStatus.icon;
                    
                    return (
                      <div key={product.id} className="product-item">
                        <div className="product-info">
                          <div className="product-header">
                            <h3 className="product-name">{product.ad}</h3>
                            <span className={`stock-badge ${stockStatus.class}`}>
                              <StatusIcon size={14} />
                              {stockStatus.text}
                            </span>
                          </div>
                          <p className="product-barcode">{product.barkod}</p>
                          <div className="stock-info">
                            <span className="current-stock">
                              Mevcut: <strong>{product.stok_miktari}</strong>
                            </span>
                            <span className="min-stock">
                              Min: {product.min_stok}
                            </span>
                          </div>
                        </div>
                        <div className="product-actions">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => openStockModal(product)}
                          >
                            <FiPackage size={14} />
                            Stok Güncelle
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FiPackage size={48} className="empty-icon" />
                  <p>Ürün bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stock Movements Section */}
        <div className="movements-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Stok Hareketleri</h2>
              <div className="filters">
                <select
                  className="filter-select"
                  value={movementFilter}
                  onChange={(e) => setMovementFilter(e.target.value)}
                >
                  <option value="all">Tüm Hareketler</option>
                  <option value="giris">Giriş</option>
                  <option value="cikis">Çıkış</option>
                </select>
                <input
                  type="date"
                  className="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body p-0">
              {filteredMovements.length > 0 ? (
                <div className="movements-list">
                  {filteredMovements.slice(0, 20).map((movement) => {
                    const MovementIcon = getMovementIcon(movement.tur);
                    
                    return (
                      <div key={movement.id} className={`movement-item ${getMovementClass(movement.tur)}`}>
                        <div className="movement-icon">
                          <MovementIcon size={16} />
                        </div>
                        <div className="movement-info">
                          <div className="movement-header">
                            <span className="product-name">{movement.urun_adi}</span>
                            <span className="movement-amount">
                              {movement.tur === 'giris' ? '+' : '-'}{movement.miktar}
                            </span>
                          </div>
                          <div className="movement-details">
                            <span className="movement-date">
                              <FiCalendar size={12} />
                              {formatDate(movement.tarih)}
                            </span>
                            {movement.aciklama && (
                              <span className="movement-description">
                                {movement.aciklama}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FiCalendar size={48} className="empty-icon" />
                  <p>Hareket bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeStockModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Stok Güncelle - {selectedProduct.ad}
              </h3>
              <button className="modal-close" onClick={closeStockModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleStockUpdate}>
              <div className="modal-body">
                <div className="current-stock-info">
                  <div className="info-item">
                    <span className="info-label">Mevcut Stok:</span>
                    <span className="info-value">{selectedProduct.stok_miktari}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Minimum Stok:</span>
                    <span className="info-value">{selectedProduct.min_stok}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">İşlem Türü</label>
                  <select
                    name="tur"
                    className="form-select"
                    value={stockData.tur}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="giris">Stok Girişi (+)</option>
                    <option value="cikis">Stok Çıkışı (-)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Miktar</label>
                  <input
                    type="number"
                    name="miktar"
                    className="form-input"
                    value={stockData.miktar}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder="Miktar giriniz"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    name="aciklama"
                    className="form-textarea"
                    value={stockData.aciklama}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="İşlem açıklaması (opsiyonel)"
                  />
                </div>
                
                {stockData.miktar && (
                  <div className="preview-info">
                    <p className="preview-text">
                      <strong>Yeni Stok:</strong> 
                      {stockData.tur === 'giris' 
                        ? selectedProduct.stok_miktari + parseInt(stockData.miktar || 0)
                        : selectedProduct.stok_miktari - parseInt(stockData.miktar || 0)
                      }
                    </p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeStockModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiPackage />
                  Stok Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokYonetimi;