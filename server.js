const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client/build')));

// Veritabanı bağlantısı
const db = new sqlite3.Database('./barkod_sistem.db', (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına bağlandı.');
        initializeDatabase();
    }
});

// Veritabanı tablolarını oluştur
function initializeDatabase() {
    // Kategoriler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS kategoriler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL UNIQUE,
        aciklama TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ürünler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS urunler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barkod TEXT NOT NULL UNIQUE,
        ad TEXT NOT NULL,
        kategori_id INTEGER,
        stok_miktari INTEGER DEFAULT 0,
        min_stok INTEGER DEFAULT 0,
        birim_fiyat REAL DEFAULT 0,
        aciklama TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategoriler (id)
    )`);

    // Stok hareketleri tablosu
    db.run(`CREATE TABLE IF NOT EXISTS stok_hareketleri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER,
        hareket_tipi TEXT CHECK(hareket_tipi IN ('giris', 'cikis', 'duzeltme')),
        miktar INTEGER NOT NULL,
        onceki_stok INTEGER,
        yeni_stok INTEGER,
        aciklama TEXT,
        tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (urun_id) REFERENCES urunler (id)
    )`);

    // Varsayılan kategoriler ekle
    const varsayilanKategoriler = [
        ['Elektronik', 'Elektronik ürünler'],
        ['Gıda', 'Gıda ürünleri'],
        ['Giyim', 'Giyim ve aksesuar'],
        ['Ev & Yaşam', 'Ev eşyaları ve yaşam ürünleri'],
        ['Kitap & Kırtasiye', 'Kitap ve kırtasiye malzemeleri']
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO kategoriler (ad, aciklama) VALUES (?, ?)');
    varsayilanKategoriler.forEach(kategori => {
        stmt.run(kategori);
    });
    stmt.finalize();
}

// API Routes

// Kategoriler
app.get('/api/kategoriler', (req, res) => {
    db.all('SELECT * FROM kategoriler ORDER BY ad', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/kategoriler', (req, res) => {
    const { ad, aciklama } = req.body;
    db.run('INSERT INTO kategoriler (ad, aciklama) VALUES (?, ?)', [ad, aciklama], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ad, aciklama });
    });
});

// Ürünler
app.get('/api/urunler', (req, res) => {
    const query = `
        SELECT u.*, k.ad as kategori_adi 
        FROM urunler u 
        LEFT JOIN kategoriler k ON u.kategori_id = k.id 
        ORDER BY u.ad
    `;
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/urunler/:barkod', (req, res) => {
    const { barkod } = req.params;
    const query = `
        SELECT u.*, k.ad as kategori_adi 
        FROM urunler u 
        LEFT JOIN kategoriler k ON u.kategori_id = k.id 
        WHERE u.barkod = ?
    `;
    db.get(query, [barkod], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Ürün bulunamadı' });
            return;
        }
        res.json(row);
    });
});

app.post('/api/urunler', (req, res) => {
    const { barkod, ad, kategori_id, stok_miktari, min_stok, birim_fiyat, aciklama } = req.body;
    
    if (!barkod || !ad) {
        res.status(400).json({ error: 'Barkod ve ürün adı gereklidir' });
        return;
    }

    db.run(
        'INSERT INTO urunler (barkod, ad, kategori_id, stok_miktari, min_stok, birim_fiyat, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [barkod, ad, kategori_id, stok_miktari || 0, min_stok || 0, birim_fiyat || 0, aciklama],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Bu barkod zaten kullanılıyor' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            
            // İlk stok girişi kaydı
            if (stok_miktari > 0) {
                db.run(
                    'INSERT INTO stok_hareketleri (urun_id, hareket_tipi, miktar, onceki_stok, yeni_stok, aciklama) VALUES (?, ?, ?, ?, ?, ?)',
                    [this.lastID, 'giris', stok_miktari, 0, stok_miktari, 'İlk stok girişi']
                );
            }
            
            res.json({ id: this.lastID, message: 'Ürün başarıyla eklendi' });
        }
    );
});

app.put('/api/urunler/:id', (req, res) => {
    const { id } = req.params;
    const { barkod, ad, kategori_id, stok_miktari, min_stok, birim_fiyat, aciklama } = req.body;
    
    db.run(
        'UPDATE urunler SET barkod = ?, ad = ?, kategori_id = ?, stok_miktari = ?, min_stok = ?, birim_fiyat = ?, aciklama = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?',
        [barkod, ad, kategori_id, stok_miktari, min_stok, birim_fiyat, aciklama, id],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Bu barkod zaten kullanılıyor' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            res.json({ message: 'Ürün başarıyla güncellendi' });
        }
    );
});

app.delete('/api/urunler/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM urunler WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Ürün bulunamadı' });
            return;
        }
        res.json({ message: 'Ürün başarıyla silindi' });
    });
});

// Stok güncelleme (barkod ile)
app.post('/api/stok-guncelle', (req, res) => {
    const { barkod, yeni_stok, hareket_tipi, aciklama } = req.body;
    
    // Önce mevcut ürünü bul
    db.get('SELECT * FROM urunler WHERE barkod = ?', [barkod], (err, urun) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!urun) {
            res.status(404).json({ error: 'Ürün bulunamadı' });
            return;
        }
        
        const onceki_stok = urun.stok_miktari;
        const miktar = yeni_stok - onceki_stok;
        
        // Stok güncelle
        db.run('UPDATE urunler SET stok_miktari = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?', 
            [yeni_stok, urun.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Stok hareketi kaydet
            db.run(
                'INSERT INTO stok_hareketleri (urun_id, hareket_tipi, miktar, onceki_stok, yeni_stok, aciklama) VALUES (?, ?, ?, ?, ?, ?)',
                [urun.id, hareket_tipi || 'duzeltme', miktar, onceki_stok, yeni_stok, aciklama || 'Stok düzeltmesi']
            );
            
            res.json({ 
                message: 'Stok başarıyla güncellendi',
                onceki_stok,
                yeni_stok,
                miktar
            });
        });
    });
});

// Stok güncelleme (urun_id ile)
app.post('/api/stok-guncelle-id', (req, res) => {
    const { urun_id, miktar, tur, aciklama } = req.body;
    
    // Önce mevcut ürünü bul
    db.get('SELECT * FROM urunler WHERE id = ?', [urun_id], (err, urun) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!urun) {
            res.status(404).json({ error: 'Ürün bulunamadı' });
            return;
        }
        
        const onceki_stok = urun.stok_miktari;
        let yeni_stok;
        
        if (tur === 'giris') {
            yeni_stok = onceki_stok + miktar;
        } else if (tur === 'cikis') {
            yeni_stok = onceki_stok - miktar;
            if (yeni_stok < 0) {
                res.status(400).json({ error: 'Stok miktarı negatif olamaz' });
                return;
            }
        } else {
            res.status(400).json({ error: 'Geçersiz işlem türü' });
            return;
        }
        
        // Stok güncelle
        db.run('UPDATE urunler SET stok_miktari = ?, guncelleme_tarihi = CURRENT_TIMESTAMP WHERE id = ?', 
            [yeni_stok, urun.id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Stok hareketi kaydet
            const hareket_miktari = tur === 'giris' ? miktar : -miktar;
            db.run(
                'INSERT INTO stok_hareketleri (urun_id, hareket_tipi, miktar, onceki_stok, yeni_stok, aciklama) VALUES (?, ?, ?, ?, ?, ?)',
                [urun.id, tur, hareket_miktari, onceki_stok, yeni_stok, aciklama || 'Stok hareketi']
            );
            
            res.json({ 
                message: 'Stok başarıyla güncellendi',
                onceki_stok,
                yeni_stok,
                miktar: hareket_miktari
            });
        });
    });
});

// Stok hareketleri
app.get('/api/stok-hareketleri/:urun_id?', (req, res) => {
    const { urun_id } = req.params;
    let query = `
        SELECT sh.*, u.ad as urun_adi, u.barkod 
        FROM stok_hareketleri sh 
        JOIN urunler u ON sh.urun_id = u.id
    `;
    let params = [];
    
    if (urun_id) {
        query += ' WHERE sh.urun_id = ?';
        params.push(urun_id);
    }
    
    query += ' ORDER BY sh.tarih DESC LIMIT 100';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Dashboard istatistikleri
app.get('/api/dashboard', (req, res) => {
    const stats = {};
    
    // Toplam ürün sayısı
    db.get('SELECT COUNT(*) as toplam FROM urunler', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        stats.toplam_urun = row.toplam;
        
        // Düşük stoklu ürünler
        db.get('SELECT COUNT(*) as dusuk_stok FROM urunler WHERE stok_miktari <= min_stok AND min_stok > 0', (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            stats.dusuk_stok = row.dusuk_stok;
            
            // Toplam stok değeri
            db.get('SELECT SUM(stok_miktari * birim_fiyat) as toplam_deger FROM urunler', (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                stats.toplam_deger = row.toplam_deger || 0;
                
                // Kategori sayısı
                db.get('SELECT COUNT(*) as kategori_sayisi FROM kategoriler', (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    stats.kategori_sayisi = row.kategori_sayisi;
                    res.json(stats);
                });
            });
        });
    });
});

// React uygulamasını serve et
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Server başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nServer kapatılıyor...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Veritabanı bağlantısı kapatıldı.');
        process.exit(0);
    });
});

module.exports = app;