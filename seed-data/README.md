# seed-data/

Seed script'in okuduğu klasör:

1. **export.json** — canlı prototip verisi. Panel › Ayarlar › YEDEK › **"Dışa aktar"** ile indirilen dosyayı buraya `export.json` adıyla koy. (`{site, exportedAt, keys: {zk_*: ...}}`)
2. **library.json** — blog kütüphanesi. Devir paketindeki `blog/library.json`'ı buraya kopyala (export.json'da `zk_blog_tree` yoksa kullanılır).

İkisi de yoksa seed sadece admin kullanıcısını yazar; sayfalar Component.DEFAULT içerikleriyle açılır.
