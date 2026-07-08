# zerdemkartal — Yayına Alma ve Claude ile Yönetim Kılavuzu

Bu dosya siteyi canlıya almak ve **her şeyi (SEO, yazılar, kod) Claude ile yönetmek**
için izlenecek adımları içerir. Ödeme entegrasyonu bilinçli olarak kapsam dışıdır.

## Mimari — tek bakışta

```
        Alan adı (domain)
              │  DNS
              ▼
          Vercel  ───────────►  Neon (Postgres veritabanı)
   (Next.js siteyi çalıştırır)
              ▲
              │  iki yönetim kanalı — ikisi de "Claude"
              ├─ (1) İÇERİK: Claude Desktop + içerik MCP → https://alanadi/api → DB
              │        blog yazısı, SEO, sayfa metni, ayarlar — canlıda, ANINDA, deploy yok
              └─ (2) KOD: Claude (Cowork) → dosyaları düzenler → Git → Vercel
                       tasarım, yeni bölüm, düzen — önce PREVIEW linki, onayınca yayına
```

- **İçerik değişiklikleri** anında canlıya yansır, deploy gerektirmez.
- **Kod değişiklikleri** her zaman önce bir önizleme linkinde görünür; sen onaylayınca
  yayına geçer ve istenirse Git geçmişinden geri alınır.

---

## Ön hazırlık — TAMAMLANDI (Claude yaptı)

- `.gitignore` eklendi (node_modules, .next, **.env sırları**, /public/uploads dışlandı).
- `prisma/schema.prisma`: Neon için `directUrl` (bağlantı havuzu) eklendi.
- `.env.example`: `DIRECT_URL` + havuzlu/havuzsuz açıklaması eklendi.

## Gereken hesaplar (hepsi ücretsiz başlar)

- **Neon** (veritabanı) — neon.tech
- **GitHub** (kod deposu) — mevcut
- **Vercel** (hosting) — vercel.com (GitHub hesabıyla giriş yapılır)

---

## Adım 1 — Neon veritabanı

1. neon.tech'te ücretsiz hesap aç → **New Project** → bölge **Frankfurt** (Türkiye'ye en yakın).
2. Dashboard → Connection Details'ten **iki** bağlantı dizesini kopyala:
   - **Pooled** (host içinde `-pooler` geçer) → `DATABASE_URL` olacak.
   - **Direct** (havuzsuz) → `DIRECT_URL` olacak.
   > Pooler görünmüyorsa ikisi de aynı direct dize olabilir; sorun değil.

## Adım 2 — Yerelde test (isteğe bağlı ama önerilir)

`faz2-backend` klasöründe terminalde:

```bash
cp .env.example .env      # değerleri doldur (aşağıdaki env tablosu)
npm install
npx prisma db push        # tabloları Neon'a kurar (shadow-DB derdi yok)
npm run seed              # içerik + blog kütüphanesini yükler
npm run dev               # http://localhost:3000
```

Mevcut prototip içeriğini taşımak için: eski panelde **Ayarlar › YEDEK › Dışa aktar** →
inen dosyayı `seed-data/export.json` olarak koy, sonra `npm run seed`.

## Adım 3 — GitHub'a yükle

```bash
cd faz2-backend
git init && git add . && git commit -m "İlk sürüm"
# GitHub'da boş, ÖZEL bir repo aç; sonra:
git remote add origin <repo-url>
git branch -M main && git push -u origin main
```

## Adım 4 — Vercel'e deploy

1. vercel.com → GitHub ile giriş → **Add New… → Project** → repoyu seç.
2. **Root Directory**: `faz2-backend` (repo tüm projeyse). Framework otomatik "Next.js" algılanır.
3. **Environment Variables**: aşağıdaki tabloyu gir.
4. **Build Command**'i şu yap: `prisma generate && next build`
   (Şema değişince tabloları güncellemek için yerelde `npx prisma db push` çalıştır.)
5. **Deploy** → `*.vercel.app` adresi verir. Aç, test et.

## Adım 5 — Alan adını bağla

1. Vercel → Project → Settings → **Domains** → alan adını ekle.
2. Domain sağlayıcının panelinde Vercel'in verdiği DNS kayıtlarını gir (A / CNAME).
3. `SITE_URL` env'ini gerçek alan adına çek → **yeniden deploy**. SSL otomatik gelir.

## Adım 6 — Claude ile yönetim (içerik MCP)

Kendi bilgisayarında (sunucuda değil):

```bash
cd mcp
npm install
```

`claude_desktop_config.json`'a ekle:

```json
{
  "mcpServers": {
    "zerdemkartal": {
      "command": "node",
      "args": ["<tam-yol>/mcp/server.js"],
      "env": {
        "API_URL": "https://alanadi/api",
        "ADMIN_TOKEN": "<Vercel'dekiyle AYNI değer>"
      }
    }
  }
}
```

Claude Desktop'ı yeniden başlat → 🔨 menüsünde araçlar görünmeli → "blog_listele çalıştır" ile test et.

---

## Env değişkenleri (Vercel'e girilecek)

| Değişken | Zorunlu | Ne |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Neon **pooled** bağlantısı |
| `DIRECT_URL` | ✅ | Neon **direct** bağlantısı (migration için) |
| `JWT_SECRET` | ✅ | Uzun rastgele dizi (panel + üye oturumu imzası) |
| `ADMIN_TOKEN` | ✅ | MCP/Claude için uzun token (JWT'den AYRI) |
| `ADMIN_EMAIL` | ✅ | İlk admin e-postası (seed yazar) |
| `ADMIN_PASSWORD` | ✅ | İlk admin şifresi |
| `SITE_URL` | ✅ | `https://alanadi` (canonical/OG) |
| `GOOGLE_CLIENT_ID` | — | Google girişi (boş bırakılabilir) |
| `INDEXNOW_KEY` | — | IndexNow anahtarı (boşsa atlanır) |

> `JWT_SECRET` ve `ADMIN_TOKEN` üretmek için (terminalde): `openssl rand -hex 32`

---

## Günlük kullanım — "her şeyi Claude ile yönetmek"

- **Yazı / SEO / sayfa metni / fiyat / ayar:** Claude Desktop'ta iste → içerik MCP canlıya yazar. Anında.
- **Tasarım / yeni bölüm / kod:** Claude'a (Cowork'te) iste → kodu düzenler → Git'e iter →
  Vercel **önizleme linki** verir → beğenince yayına. Bozulursa Git'ten geri alınır.

## Sonra (gerekince)

- **Görsel yükleme kalıcılığı:** `POST /api/assets` şu an dosyayı `public/uploads/`a yazıyor;
  Vercel'de kalıcı değil. Cloudflare R2 / Vercel Blob'a çevrilecek (görsel yüklemeye güvenmeden önce).
- Doğum haritası çark motorunu SSR'a taşı (`HaritaAraci.jsx`).
