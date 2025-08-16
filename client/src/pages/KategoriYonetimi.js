import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiSearch, 
  FiTag,
  FiX,
  FiSave,
  FiPackage
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const KategoriYonetimi = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    ad: '',
    aciklama: ''
  });
  const [categoryStats, setCategoryStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        axios.get('/api/kategoriler'),
        axios.get('/api/urunler')
      ]);
      
      setCategories(categoriesRes.data);
      
      // Calculate category statistics
      const stats = {};
      productsRes.data.forEach(product => {
        const categoryId = product.kategori_id;
        if (categoryId) {
          if (!stats[categoryId]) {
            stats[categoryId] = {
              productCount: 0,
              totalStock: 0,
              totalValue: 0
            };
          }
          stats[categoryId].productCount++;
          stats[categoryId].totalStock += product.stok_miktari || 0;
          stats[categoryId].totalValue += (product.stok_miktari || 0) * (product.birim_fiyat || 0);
        }
      });
      
      setCategoryStats(stats);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        ad: category.ad,
        aciklama: category.aciklama || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        ad: '',
        aciklama: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ad.trim()) {
      toast.error('Kategori adı gereklidir');
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(`/api/kategoriler/${editingCategory.id}`, formData);
        toast.success('Kategori başarıyla güncellendi');
      } else {
        await axios.post('/api/kategoriler', formData);
        toast.success('Kategori başarıyla eklendi');
      }
      
      await loadData();
      closeModal();
    } catch (error) {
      if (error.response?.data?.error?.includes('UNIQUE constraint failed')) {
        toast.error('Bu kategori adı zaten kullanılıyor');
      } else {
        toast.error('Kategori kaydedilirken hata oluştu');
      }
    }
  };

  const handleDelete = async (category) => {
    const stats = categoryStats[category.id];
    if (stats && stats.productCount > 0) {
      toast.error(`Bu kategoride ${stats.productCount} ürün bulunuyor. Önce ürünleri başka kategoriye taşıyın.`);
      return;
    }

    if (window.confirm(`"${category.ad}" kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`/api/kategoriler/${category.id}`);
        toast.success('Kategori başarıyla silindi');
        await loadData();
      } catch (error) {
        toast.error('Kategori silinirken hata oluştu');
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

  const filteredCategories = categories.filter(category => 
    category.ad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Kategoriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="category-management">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Kategori Yönetimi</h1>
          <p className="page-subtitle">Ürün kategorilerini yönetin</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FiPlus />
          Yeni Kategori
        </button>
      </div>

      <div className="search-section">
        <div className="card">
          <div className="card-body">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="categories-section">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Kategori Listesi</h2>
            <p className="card-subtitle">{filteredCategories.length} kategori bulundu</p>
          </div>
          <div className="card-body p-0">
            {filteredCategories.length > 0 ? (
              <div className="categories-grid">
                {filteredCategories.map((category) => {
                  const stats = categoryStats[category.id] || {
                    productCount: 0,
                    totalStock: 0,
                    totalValue: 0
                  };
                  
                  return (
                    <div key={category.id} className="category-card">
                      <div className="category-header">
                        <div className="category-icon">
                          <FiTag size={24} />
                        </div>
                        <div className="category-actions">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => openModal(category)}
                            title="Düzenle"
                          >
                            <FiEdit3 size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(category)}
                            title="Sil"
                            disabled={stats.productCount > 0}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="category-content">
                        <h3 className="category-name">{category.ad}</h3>
                        {category.aciklama && (
                          <p className="category-description">{category.aciklama}</p>
                        )}
                        
                        <div className="category-stats">
                          <div className="stat-item">
                            <FiPackage className="stat-icon" />
                            <div className="stat-content">
                              <span className="stat-value">{stats.productCount}</span>
                              <span className="stat-label">Ürün</span>
                            </div>
                          </div>
                          
                          <div className="stat-item">
                            <FiTag className="stat-icon" />
                            <div className="stat-content">
                              <span className="stat-value">{stats.totalStock}</span>
                              <span className="stat-label">Toplam Stok</span>
                            </div>
                          </div>
                          
                          <div className="stat-item">
                            <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
                            <span className="stat-label">Toplam Değer</span>
                          </div>
                        </div>
                      </div>
                      
                      {stats.productCount > 0 && (
                        <div className="category-footer">
                          <span className="product-count-badge">
                            {stats.productCount} ürün içeriyor
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <FiTag size={48} className="empty-icon" />
                <p>Kategori bulunamadı</p>
                <button className="btn btn-primary" onClick={() => openModal()}>
                  <FiPlus />
                  İlk Kategoriyi Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kategori Adı *</label>
                  <input
                    type="text"
                    name="ad"
                    className="form-input"
                    value={formData.ad}
                    onChange={handleInputChange}
                    required
                    placeholder="Kategori adını giriniz"
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    name="aciklama"
                    className="form-textarea"
                    value={formData.aciklama}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Kategori açıklaması (opsiyonel)"
                  />
                </div>
                
                {editingCategory && categoryStats[editingCategory.id] && (
                  <div className="category-info">
                    <h4 className="info-title">Kategori İstatistikleri</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Ürün Sayısı:</span>
                        <span className="info-value">{categoryStats[editingCategory.id].productCount}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Toplam Stok:</span>
                        <span className="info-value">{categoryStats[editingCategory.id].totalStock}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Toplam Değer:</span>
                        <span className="info-value">{formatCurrency(categoryStats[editingCategory.id].totalValue)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiSave />
                  {editingCategory ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KategoriYonetimi;