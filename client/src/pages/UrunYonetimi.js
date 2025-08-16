import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiSearch, 
  FiPackage,
  FiX,
  FiSave,
  FiFilter
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const UrunYonetimi = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    barkod: '',
    ad: '',
    kategori_id: '',
    stok_miktari: 0,
    min_stok: 0,
    birim_fiyat: 0,
    aciklama: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/urunler'),
        axios.get('/api/kategoriler')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barkod: product.barkod,
        ad: product.ad,
        kategori_id: product.kategori_id || '',
        stok_miktari: product.stok_miktari,
        min_stok: product.min_stok,
        birim_fiyat: product.birim_fiyat,
        aciklama: product.aciklama || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barkod: '',
        ad: '',
        kategori_id: '',
        stok_miktari: 0,
        min_stok: 0,
        birim_fiyat: 0,
        aciklama: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.barkod || !formData.ad) {
      toast.error('Barkod ve ürün adı gereklidir');
      return;
    }

    try {
      if (editingProduct) {
        await axios.put(`/api/urunler/${editingProduct.id}`, formData);
        toast.success('Ürün başarıyla güncellendi');
      } else {
        await axios.post('/api/urunler', formData);
        toast.success('Ürün başarıyla eklendi');
      }
      
      await loadData();
      closeModal();
    } catch (error) {
      if (error.response?.data?.error?.includes('UNIQUE constraint failed')) {
        toast.error('Bu barkod zaten kullanılıyor');
      } else {
        toast.error('Ürün kaydedilirken hata oluştu');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (product) => {
    if (window.confirm(`"${product.ad}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`/api/urunler/${product.id}`);
        toast.success('Ürün başarıyla silindi');
        await loadData();
      } catch (error) {
        toast.error('Ürün silinirken hata oluştu');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barkod.includes(searchTerm);
    const matchesCategory = !filterCategory || product.kategori_id?.toString() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const getStockStatus = (current, min) => {
    if (min > 0 && current <= min) {
      return { class: 'badge-warning', text: 'Düşük' };
    } else if (current === 0) {
      return { class: 'badge-error', text: 'Yok' };
    } else {
      return { class: 'badge-success', text: 'Normal' };
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Ürünler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Ürün Yönetimi</h1>
          <p className="page-subtitle">Ürün ekleme, düzenleme ve listeleme</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FiPlus />
          Yeni Ürün
        </button>
      </div>

      <div className="filters-section">
        <div className="card">
          <div className="card-body">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Ürün Ara</label>
                <div className="input-group">
                  <FiSearch className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ürün adı veya barkod..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Kategori Filtresi</label>
                <div className="input-group">
                  <FiFilter className="input-icon" />
                  <select
                    className="form-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.ad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="products-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Ürün Listesi</h2>
            <p className="card-subtitle">{filteredProducts.length} ürün bulundu</p>
          </div>
          <div className="card-body p-0">
            {filteredProducts.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barkod</th>
                      <th>Ürün Adı</th>
                      <th>Kategori</th>
                      <th>Stok</th>
                      <th>Min. Stok</th>
                      <th>Fiyat</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stok_miktari, product.min_stok);
                      return (
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
                            <span className={`badge ${stockStatus.class}`}>
                              {product.stok_miktari}
                            </span>
                          </td>
                          <td>{product.min_stok}</td>
                          <td className="font-medium">
                            {formatCurrency(product.birim_fiyat)}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => openModal(product)}
                                title="Düzenle"
                              >
                                <FiEdit3 size={14} />
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(product)}
                                title="Sil"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Barkod *</label>
                    <input
                      type="text"
                      name="barkod"
                      className="form-input"
                      value={formData.barkod}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Ürün Adı *</label>
                    <input
                      type="text"
                      name="ad"
                      className="form-input"
                      value={formData.ad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select
                      name="kategori_id"
                      className="form-select"
                      value={formData.kategori_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.ad}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{editingProduct ? 'Mevcut Stok' : 'Başlangıç Stok'}</label>
                    <input
                      type="number"
                      name="stok_miktari"
                      className="form-input"
                      value={formData.stok_miktari}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Minimum Stok</label>
                    <input
                      type="number"
                      name="min_stok"
                      className="form-input"
                      value={formData.min_stok}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Birim Fiyat</label>
                    <input
                      type="number"
                      name="birim_fiyat"
                      className="form-input"
                      value={formData.birim_fiyat}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    name="aciklama"
                    className="form-textarea"
                    value={formData.aciklama}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Ürün açıklaması..."
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiSave />
                  {editingProduct ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrunYonetimi;