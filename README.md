# Barkod Sistemi

Modern ve kullanıcı dostu bir barkod yönetim sistemi. React frontend ve Node.js backend ile geliştirilmiştir.

## Özellikler

- 📊 **Dashboard**: Sistem genel durumu ve istatistikler
- 📦 **Ürün Yönetimi**: Ürün ekleme, düzenleme ve silme
- 📋 **Stok Yönetimi**: Stok takibi ve stok hareketleri
- 🏷️ **Kategori Yönetimi**: Ürün kategorilerini organize etme
- 📱 **Barkod Okuyucu**: Kamera ile barkod okuma
- 📈 **Raporlar**: Detaylı analiz ve raporlama
- 🌙 **Karanlık Mod**: Göz dostu karanlık tema
- 📱 **Responsive Tasarım**: Mobil ve tablet uyumlu

## Teknolojiler

### Frontend
- React 18
- Modern CSS3
- Responsive Design
- Dark Mode Support

### Backend
- Node.js
- Express.js
- SQLite Database
- RESTful API

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone <repository-url>
   cd barkod-sistemi
   ```

2. **Backend bağımlılıklarını yükleyin**
   ```bash
   npm install
   ```

3. **Frontend bağımlılıklarını yükleyin**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Backend sunucusunu başlatın**
   ```bash
   node server.js
   ```
   Backend http://localhost:3001 adresinde çalışacaktır.

5. **Frontend uygulamasını başlatın** (yeni terminal)
   ```bash
   cd client
   npm start
   ```
   Frontend http://localhost:3000 adresinde çalışacaktır.

## API Endpoints

### Ürünler
- `GET /api/urunler` - Tüm ürünleri listele
- `POST /api/urunler` - Yeni ürün ekle
- `PUT /api/urunler/:id` - Ürün güncelle
- `DELETE /api/urunler/:id` - Ürün sil

### Kategoriler
- `GET /api/kategoriler` - Tüm kategorileri listele
- `POST /api/kategoriler` - Yeni kategori ekle
- `PUT /api/kategoriler/:id` - Kategori güncelle
- `DELETE /api/kategoriler/:id` - Kategori sil

### Stok Hareketleri
- `GET /api/stok-hareketleri` - Stok hareketlerini listele
- `POST /api/stok-hareketleri` - Yeni stok hareketi ekle

### Dashboard
- `GET /api/dashboard` - Dashboard istatistikleri

## Proje Yapısı

```
barkod-sistemi/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server.js              # Express Backend
├── package.json           # Backend bağımlılıkları
├── barkod_sistem.db      # SQLite veritabanı
└── README.md
```

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Proje hakkında sorularınız için issue açabilirsiniz.

---

**Not**: Bu sistem eğitim ve geliştirme amaçlı hazırlanmıştır. Üretim ortamında kullanmadan önce güvenlik ve performans testlerini yapınız.