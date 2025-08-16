import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { 
  FiCamera, 
  FiSearch, 
  FiPackage, 
  FiEdit3, 
  FiTrendingUp, 
  FiTrendingDown,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './BarkodOkuyucu.css';

const BarkodOkuyucu = () => {
  const [scannerActive, setScannerActive] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [movementType, setMovementType] = useState('duzeltme');
  const [scannedProducts, setScannedProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    if (scannerActive) return;
    
    setScannerActive(true);
    setProduct(null);
    
    html5QrcodeScanner.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2
      },
      false
    );

    html5QrcodeScanner.current.render(
      (decodedText) => {
        searchProduct(decodedText);
        stopScanner();
      },
      (error) => {
        // Sessizce hataları yoksay
      }
    );
  };

  const stopScanner = () => {
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear();
      html5QrcodeScanner.current = null;
    }
    setScannerActive(false);
  };

  const searchProduct = async (barcode) => {
    if (!barcode.trim()) {
      toast.error('Lütfen geçerli bir barkod girin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/urunler/${barcode.trim()}`);
      const foundProduct = response.data;
      setProduct(foundProduct);
      
      // Ürünü listeye ekle veya miktarını artır
      addProductToList(foundProduct);
      
      // Input'u temizle ve odaklan
      setManualBarcode('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      toast.success('Ürün eklendi!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Ürün bulunamadı');
        setProduct(null);
      } else {
        toast.error('Ürün aranırken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const addProductToList = useCallback((product) => {
    setScannedProducts(prevProducts => {
      const existingProductIndex = prevProducts.findIndex(p => p.barkod === product.barkod);
      
      if (existingProductIndex !== -1) {
        // Ürün zaten listede, miktarını artır
        const updatedProducts = [...prevProducts];
        updatedProducts[existingProductIndex].miktar += 1;
        updatedProducts[existingProductIndex].toplam_fiyat = 
          updatedProducts[existingProductIndex].miktar * updatedProducts[existingProductIndex].birim_fiyat;
        
        return updatedProducts;
      } else {
        // Yeni ürün ekle
        const newProduct = {
          ...product,
          miktar: 1,
          toplam_fiyat: product.birim_fiyat
        };
        
        return [...prevProducts, newProduct];
      }
    });
  }, []);

  // Toplam fiyatı hesapla
  useEffect(() => {
    const newTotal = scannedProducts.reduce((sum, p) => sum + p.toplam_fiyat, 0);
    setTotalPrice(newTotal);
  }, [scannedProducts]);

  const removeProductFromList = useCallback((barkod) => {
    setScannedProducts(prevProducts => {
      return prevProducts.filter(p => p.barkod !== barkod);
    });
  }, []);

  const clearAllProducts = useCallback(() => {
    setScannedProducts([]);
    setProduct(null);
  }, []);

  const handleManualSearch = (e) => {
    e.preventDefault();
    searchProduct(manualBarcode);
  };

  const openStockModal = () => {
    if (!product) return;
    setNewStock(product.stok_miktari.toString());
    setStockNote('');
    setMovementType('duzeltme');
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setNewStock('');
    setStockNote('');
  };

  const updateStock = async (e) => {
    e.preventDefault();
    
    if (!product || newStock === '') {
      toast.error('Lütfen geçerli bir stok miktarı girin');
      return;
    }

    const stockAmount = parseInt(newStock);
    if (isNaN(stockAmount) || stockAmount < 0) {
      toast.error('Stok miktarı geçerli bir sayı olmalıdır');
      return;
    }

    try {
      await axios.post('/api/stok-guncelle', {
        barkod: product.barkod,
        yeni_stok: stockAmount,
        hareket_tipi: movementType,
        aciklama: stockNote || 'Barkod okuyucu ile güncelleme'
      });

      // Ürün bilgilerini yenile
      await searchProduct(product.barkod);
      
      toast.success('Stok başarıyla güncellendi');
      closeStockModal();
    } catch (error) {
      toast.error('Stok güncellenirken hata oluştu');
    }
  };

  const getStockStatus = (current, min) => {
    if (min > 0 && current <= min) {
      return { status: 'low', text: 'Düşük Stok', class: 'badge-warning' };
    } else if (current === 0) {
      return { status: 'empty', text: 'Stok Yok', class: 'badge-error' };
    } else {
      return { status: 'normal', text: 'Normal', class: 'badge-success' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <div className="header-content">
          <h1 className="scanner-title">Barkod Okuyucu</h1>
          <p className="scanner-subtitle">Ürün arama ve stok güncelleme</p>
        </div>
      </div>

      <div className="scanner-content">
        {/* Scanner Section */}
        <div className="scanner-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Barkod Tarama</h2>
              <p className="card-subtitle">Manuel barkod girişi yapın</p>
            </div>
            <div className="card-body">
              {/* Manual Input */}
              <div className="manual-section">
                
                <form onSubmit={handleManualSearch} className="manual-form">
                  <div className="form-group">
                    <label className="form-label">Manuel Barkod Girişi</label>
                    <div className="input-group">
                      <input
                        ref={inputRef}
                        type="text"
                        className="form-input"
                        placeholder="Barkod numarasını girin..."
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        disabled={loading}
                        autoFocus
                      />
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading || !manualBarcode.trim()}
                      >
                        {loading ? (
                          <div className="spinner" />
                        ) : (
                          <FiSearch />
                        )}
                        Ara
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Scanned Products List */}
        {scannedProducts.length > 0 && (
          <div className="products-list-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Okutulan Ürünler</h2>
                <div className="card-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={clearAllProducts}
                  >
                    <FiX />
                    Temizle
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="products-list">
                  {scannedProducts.map((item, index) => (
                    <div key={`${item.barkod}-${index}`} className="product-item">
                      <div className="product-info">
                        <div className="product-header">
                          <div className="product-icon">
                            <FiPackage size={24} />
                          </div>
                          <div className="product-details">
                            <h4 className="product-name">{item.ad}</h4>
                            <p className="product-barcode">
                              <FiCamera size={14} />
                              {item.barkod}
                            </p>
                          </div>
                        </div>
                        <div className="product-stats">
                          <div className="stat-item">
                            <label>Miktar</label>
                            <span className="stat-value">{item.miktar}</span>
                          </div>
                          <div className="stat-item">
                            <label>Birim Fiyat</label>
                            <span className="stat-value">{formatCurrency(item.birim_fiyat)}</span>
                          </div>
                          <div className="stat-item">
                            <label>Toplam</label>
                            <span className="stat-value price">{formatCurrency(item.toplam_fiyat)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => removeProductFromList(item.barkod)}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="total-section">
                  <div className="total-price">
                    <h3>Toplam: {formatCurrency(totalPrice)}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Info Section */}
        {product && (
          <div className="product-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Son Okutulan Ürün</h2>
                <div className="card-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={openStockModal}
                  >
                    <FiEdit3 />
                    Stok Güncelle
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="product-info">
                  <div className="product-header">
                    <div className="product-icon">
                      <FiPackage size={32} />
                    </div>
                    <div className="product-details">
                      <h3 className="product-name">{product.ad}</h3>
                      <p className="product-barcode">
                        <FiCamera size={16} />
                        {product.barkod}
                      </p>
                    </div>
                  </div>

                  <div className="product-stats">
                    <div className="stat-item">
                      <label>Kategori</label>
                      <span className="badge badge-info">
                        {product.kategori_adi || 'Kategorisiz'}
                      </span>
                    </div>
                    
                    <div className="stat-item">
                      <label>Mevcut Stok</label>
                      <div className="stock-info">
                        <span className="stock-amount">{product.stok_miktari}</span>
                        <span className={`badge ${getStockStatus(product.stok_miktari, product.min_stok).class}`}>
                          {getStockStatus(product.stok_miktari, product.min_stok).text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="stat-item">
                      <label>Minimum Stok</label>
                      <span className="stat-value">{product.min_stok}</span>
                    </div>
                    
                    <div className="stat-item">
                      <label>Birim Fiyat</label>
                      <span className="stat-value price">
                        {formatCurrency(product.birim_fiyat)}
                      </span>
                    </div>
                  </div>

                  {product.aciklama && (
                    <div className="product-description">
                      <label>Açıklama</label>
                      <p>{product.aciklama}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={closeStockModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Stok Güncelle</h3>
              <button className="modal-close" onClick={closeStockModal}>
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={updateStock}>
              <div className="modal-body">
                <div className="current-stock">
                  <p><strong>Ürün:</strong> {product?.ad}</p>
                  <p><strong>Mevcut Stok:</strong> {product?.stok_miktari}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Hareket Tipi</label>
                  <select 
                    className="form-select"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                  >
                    <option value="duzeltme">Düzeltme</option>
                    <option value="giris">Stok Girişi</option>
                    <option value="cikis">Stok Çıkışı</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Yeni Stok Miktarı</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Açıklama (Opsiyonel)</label>
                  <textarea
                    className="form-textarea"
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="Stok güncelleme açıklaması..."
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeStockModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiRefreshCw />
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarkodOkuyucu;