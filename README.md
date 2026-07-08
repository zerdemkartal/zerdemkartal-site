# zerdemkartal — Faz 2 Backend

> Prototipin (localStorage) gerçek sunucu karşılığı. **Çalıştırılmaya hazır**: şema, seed, API uçları, auth, `zk-data.js` API adaptörü + **tüm public sayfaların SSR portu** (meta + JSON-LD + içerik sunucuda). Ödeme (Faz 2.5) bilinçli olarak dışarıda bırakıldı.

## Kurulum

```bash
npm install
cp .env.example .env          # değerleri doldur
npx prisma migrate dev --name init
npm run seed                  # library.json + panel export'unu DB'ye yazar
npm run dev                   # http://localhost:3000
```

## Yapı

| Yol | Ne |
|---|---|
| `prisma/schema.prisma` | Veri modeli (localStorage `zk_*` → tablolar) |
| `prisma/seed.mjs` | Seed: `seed-data/export.json` (panel › Ayarlar › YEDEK › Dışa aktar) + `seed-data/library.json` (blog) |
| `src/app/api/**` | API uçları — FAZLAR.md §2.3 sözleşmesiyle birebir |
| `src/lib/auth.js` | Admin JWT + uzun ömürlü `ADMIN_TOKEN` (MCP için) |
| `public/zk-data.js` | Prototip sayfalarının **API'ye bağlanan** veri katmanı (drop-in) |
| `src/app/**/page.jsx` | **SSR portları** — tüm public rotalar (aşağıda) |
| `src/components/` | Chrome (nav/footer + stil token'ları), JsonLd, ProgramDetay şablonu |
| `src/lib/site.js` | SITE/ORG/WEBSITE sabitleri, slugify, pageMeta |
| `src/lib/indexnow.js` | IndexNow pingi (içerik yazan admin uçları çağırır; INDEXNOW_KEY boşsa no-op) |

## SSR rotaları (Faz 2.7 — tamamlandı)

`/` · `/danismanliklar` (+ `/danismanliklar/analiz/[slug]` derin linkleri) · `/programlar` · `/programlar/astropen` · `/programlar/hermes` · `/astroloji-101` · `/blog` + `/blog/yazi/[id]` · `/dogum-haritasi` · `/hakkimda` · `/iletisim` (form → `POST /api/leads`) · `/yasal/[slug]` (4 metin, prototipten port) · `/uye` (gerçek auth: register/login/me; noindex)

- İçerik DB'den (`PageContent`), meşhur alanlar boşsa güvenli varsayılanlar; **generateMetadata + JSON-LD prototipteki `_buildJsonLd`'lerin birebir portu**, ISR `revalidate: 300`.
- Görsel parite: sayfalar marka tipografi/renkleriyle semantik port'tır; piksel referansı `.dc.html` dosyalarıdır (her page.jsx başındaki not).
- `/dogum-haritasi` aracı: form kabuğu hazır; çark/hesap motoru `Dogum Haritasi.dc.html`'den `HaritaAraci.jsx`'e port edilecek (dosya başında adım adım not).
- `sitemap.xml` / `robots.txt` / `llms.txt` dinamik route'lar; **IndexNow**: content/blog yazmaları ping atar, anahtar `/indexnow.txt`'ten servis edilir.

## API sözleşmesi

Public (okuma):
- `GET /api/bootstrap` — tüm public içerik tek JSON'da (adaptör ilk yüklemede çeker)
- `GET /api/content/:key` — `anasayfa | danismanlik | programlar | pd_astropen | pd_hermes | astroloji101 | harita | hakkimda`
- `GET /api/blog/tree` · `GET /api/blog/pages/:id` · `GET /api/blog/showcase`
- `POST /api/leads` — talep / ön sipariş / iletişim formu

Admin (`Authorization: Bearer <token>`):
- `POST /api/auth/login` → JWT
- `PUT /api/content/:key`
- `PUT /api/blog/tree` · `POST|PUT /api/blog/pages/:id` · `PUT /api/blog/showcase`
- `GET|PUT /api/settings`
- `GET /api/leads` · `PATCH /api/leads/:id` (status/not)
- `GET /api/members`
- `POST /api/assets` (multipart → URL döner)

**Silme ucu bilinçli olarak yok** (panel + MCP kuralı). Eklenecekse soft-delete + onay.

## zk-data adaptörü (geçiş köprüsü)

`public/zk-data.js`, prototipteki dosyanın API sürümüdür: açılışta `/api/bootstrap`'ı belleğe alır (sayfalar senkron `getItem` ile okumaya devam eder), her `setItem`'ı arkada ilgili uca yazar (admin token `sessionStorage.zk_admin_jwt`):

- İçerik anahtarları → `PUT /api/content/:key`; blog/showcase/settings kendi uçlarına.
- **Liste senkronu** (`zk_admin_talep`, `zk_siparis`): yeni kayıt → `POST`, durum/not değişikliği → `PATCH /:id` (id→alan-imzası gölge haritasıyla diff).
- **Admin hidrasyonu**: JWT varsa açılışta `GET /api/leads|orders|members` → `zk_admin_talep`/`zk_siparis`/`zk_uye_hesaplar` cache'e alınır (bootstrap public olduğundan e-postalı listeler orada YOK). Panel girişten sonra `ZKData.refreshAdmin()` çağırabilir.

Bu köprü panel + mevcut sayfaları API'ye bağlar; **nihai hedef yine SSR port'udur** (crawler'lar için şart — bkz. SEO-Backend-Rehberi).

## Sonraki adımlar

1. ~~Public sayfaları SSR'a port et~~ ✅ (tüm rotalar; görsel cila · .dc.html referansıyla)
2. ~~`sitemap.xml` / `robots.txt` / `llms.txt` dinamik~~ ✅ + IndexNow ✅
3. ~~Üye auth'u (bcrypt + JWT; Google id_token sunucuda)~~ ✅ (uçlar + `/uye` sayfası)
4. Doğum haritası çark/hesap motorunu `HaritaAraci.jsx`'e port et (kaynak: `Dogum Haritasi.dc.html`).
5. Asset pipeline: `POST /api/assets` dosyayı `public/uploads/`a yazıyor — üretimde S3/R2'ye çevir (FAZLAR §2.5).
6. Deploy: env'ler, HTTPS/CDN, yedekleme, staging (FAZLAR §2.8) — bu ortamda yapılamaz.
7. **Faz 2.5 (ödeme) ATLANDI** (kullanıcı kararı) — iyzico/PayTR entegre edilince PD sayfalarındaki ön sipariş CTA'ları `POST /api/orders` akışına bağlanır.
8. **Faz 3 (MCP) hazır**: `../mcp/` — gerçek API sözleşmesine bağlı 18 araç + Claude Desktop config (README'sinde).
