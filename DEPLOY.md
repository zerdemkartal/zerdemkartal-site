# zerdemkartal — Yayına Alma ve Claude ile Yönetim Kılavuzu

Bu dosya siteyi canlıya almak, PayTR Link ödemesini güvenle etkinleştirmek ve
**her şeyi (SEO, yazılar, kod) Claude ile yönetmek** için izlenecek adımları içerir.

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
4. Build komutu depodaki `vercel.json` tarafından `npm run build` olarak
   sabitlenmiştir. Vercel panelindeki eski Build Command değeri bu dosya tarafından
   geçersiz kılınır. `postinstall` zaten `prisma generate` çalıştırır.
   **`prisma db push` build komutuna eklenmez.** Şema değişikliği ayrı ve kontrollü
   bir veritabanı işlemi olarak yürütülür.
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
| `RESEND_API_KEY` | Posta için ✅ | Resend API anahtarı; kurumsal gönderim ve gelen ileti gövdesini almak için |
| `RESEND_WEBHOOK_SECRET` | Gelen posta için ✅ | Resend `email.received` webhook imza sırrı (`whsec_...`) |
| `MAILBOX_ADDRESSES` | Posta için ✅ | Posta Merkezi adresleri; ilk kurulumda `info@hermesastroloji.com` |
| `MAILBOX_FROM_NAME` | — | Gönderen görünen adı; varsayılan `Hermes Astroloji` |
| `EMAIL_FROM` | İşlemsel posta için ✅ | Ödeme/lisans e-postalarının göndereni; `Hermes Astroloji <info@hermesastroloji.com>` |
| `GOOGLE_CLIENT_ID` | Lisans paneli için ✅ | Google Identity Services Web istemci kimliği (`*.apps.googleusercontent.com`) |
| `LICENSE_GOOGLE_ONLY` | Lisans paneli için ✅ | `1`: parola uçlarını kapatır; yalnız Google → Authenticator akışını kabul eder |
| `LICENSE_GOOGLE_OWNER_EMAIL` | Lisans paneli için ✅ | Google kimliği kabul edilecek tek sahip Gmail adresi |
| `INDEXNOW_KEY` | — | IndexNow anahtarı (boşsa atlanır) |
| `PAYTR_MERCHANT_ID` | Kartlı ödeme için ✅ | PayTR mağaza numarası |
| `PAYTR_MERCHANT_KEY` | Kartlı ödeme için ✅ | PayTR entegrasyon anahtarı; yalnız Vercel sırrı |
| `PAYTR_MERCHANT_SALT` | Kartlı ödeme için ✅ | PayTR entegrasyon salt değeri; yalnız Vercel sırrı |
| `PAYTR_MAX_INSTALLMENT` | — | PayTR ekranındaki üst taksit sınırı; varsayılan `12` |
| `PAYTR_DEBUG` | Testte ✅ | Entegrasyon testinde `1`, canlı onaydan sonra `0` |
| `PAYTR_PRICE_BUFFER_PERCENT` | — | PayTR oranına eklenecek sözleşmesel pay; normalde `0` |
| `PAYTR_SINGLE_RATIO_FALLBACK` | — | İlk oran sorgusu başarısızsa kullanılacak geçici güncel oran; boşsa kart ödeme güvenli biçimde kapanır |

> `JWT_SECRET` ve `ADMIN_TOKEN` üretmek için (terminalde): `openssl rand -hex 32`

---

## Kurumsal Posta Merkezi — Resend bağlantısı

Site kendi yönetim panelinde bir posta merkezi sunar: iletişim formu ve gelen
kurumsal e-postalar Neon'da konuşma olarak saklanır; yanıtlar Resend üzerinden
gönderilir. Bu yapı web tabanlıdır, IMAP/Outlook posta kutusu değildir.

1. Resend → **Domains** altında `hermesastroloji.com` alan adını ekle.
2. Resend'in verdiği gönderim kayıtlarını (SPF/DKIM) ve **Receiving** için verdiği
   MX kayıtlarını alan adının DNS paneline aynen gir; değerleri tahmin etme.
3. Resend → **Webhooks** içinde şu adresi ekle ve yalnız `email.received` olayını seç:
   `https://hermesastroloji.com/api/mail/webhook/resend`
4. Webhook ayrıntısındaki imza sırrını Vercel'e `RESEND_WEBHOOK_SECRET`, Resend API
   anahtarını `RESEND_API_KEY` olarak ekle. Yukarıdaki `MAILBOX_*` değerlerini de gir.
5. Vercel'de yeniden deploy et. Yönetim → **Kurumsal Posta** başlığında
   “Gönderim ve alım bağlı” görünmelidir.
6. Önce dış bir hesaptan `info@hermesastroloji.com` adresine deneme iletisi
   gönder; panelde görünmesini ve panel yanıtının aynı konuşmaya dönmesini doğrula.
   Bu kabul geçmeden sitedeki eski iletişim adresini yeni adrese çevirme.

### Teslim edilebilirlik ve spam koruması

1. Resend alan adı **Verified** olmadan gönderimi açma. Bu durum Resend'in verdiği
   SPF ve DKIM kayıtlarının ikisinin de geçtiğini doğrular.
2. İlk aşamada `_dmarc.hermesastroloji.com` için raporlama amaçlı `p=none`
   politikası kullan; bütün gerçek gönderim kaynakları DMARC `pass` verdikten sonra
   sırayla `p=quarantine`, ardından gerekiyorsa `p=reject` politikasına geç.
   DMARC kaydındaki rapor adresi gerçekten posta alabilen bir adres olmalıdır.
3. Yeni alan adını düşük hacimli gerçek işlem e-postalarıyla kademeli ısıt; ilk
   günlerde toplu veya deneme amaçlı yüksek hacimli gönderim yapma.
4. E-posta içindeki bağlantıları yalnız `hermesastroloji.com` alanında tut; açık ve
   tıklama izlemeyi kapalı bırak, görsel sayısını düşük, metni kısa ve doğrudan tut.
5. Resend **Emails/Suppressions** ekranında bounce, complaint ve suppressed
   durumlarını izle; yazım hatalı veya kalıcı reddedilmiş adrese tekrar gönderme.
6. Gmail ve Outlook testlerinde ileti başlıklarından `spf=pass`, `dkim=pass` ve
   `dmarc=pass` üçlüsünü doğrula. Gelen kutusuna düşme hiçbir sağlayıcı tarafından
   yüzde yüz garanti edilmez; kimlik doğrulama, düşük şikâyet ve gerçek etkileşim
   alan adı itibarını birlikte oluşturur.

### Posta görevlisi girişi

Posta görevlisi doğrudan `https://hermesastroloji.com/yonetim/posta` adresinden
e-posta ve şifreyle girer. Hesap `AdminUser.role = mail_operator` olarak saklanır;
bu oturum yalnız `/api/mail/*` uçlarında geçerlidir. `/yonetim` anahtarı,
içerik/sipariş/üye ve diğer yönetim API’leri bu role kapalıdır.

Hesabı ilk kez oluşturmak veya şifresini sıfırlamak için parola hiçbir dosyaya
yazılmadan yalnız komut süresince ortam değişkeni olarak verilir:

```powershell
$env:MAIL_OPERATOR_EMAIL='info@hermesastroloji.com'
$env:MAIL_OPERATOR_PASSWORD='<en-az-14-karakter-yeni-sifre>'
npm run mail:operator
Remove-Item Env:MAIL_OPERATOR_EMAIL, Env:MAIL_OPERATOR_PASSWORD
```

Neon veritabanına yalnız bcrypt parola özeti yazılır. Ana yönetim `ADMIN_TOKEN`
değeri posta görevlisiyle paylaşılmaz.

### PayTR Link satın alma akışı

Fiyat sayfasındaki **Satın al** eylemi `/satin-al` rotasını açar. Bu ekran ad,
e-posta, telefon, adres, TCKN/VKN, fatura veya kart bilgisi istemez. Yalnız plan
seçimi ve yasal metin sürümü sunucuya gönderilir:

1. `/api/pay/paytr/pricing`, PayTR oran servisinden mağazanın güncel tek çekim
   oranını alır. EFT hedefi `net / (1 - oran)` formülüyle kuruşa yukarı yuvarlanır.
2. `/api/pay/paytr/link`, kişisel veri içermeyen, 30 dakika geçerli ve tek kullanımlık
   ürün linki oluşturur. `pft` gönderilmez; taksit farkı PayTR ekranında müşteriye
   yansır.
3. Müşteri ad, iletişim, fatura ve kart bilgilerini yalnız PayTR sayfasına girer.
4. `/api/pay/paytr/callback`, HMAC doğrulamasından sonra yalnız anonim işlem özeti
   (`merchantOid`, plan, tutarlar, ödeme türü, test modu, sözleşme sürümü) saklar.
   Aynı `merchantOid` tekrar gelirse ikinci teslim oluşturmaz ve yalnız `OK` döner.
5. EFT/Havale seçeneği Vercel API’sine veri yazmaz; WhatsApp’ta banka bilgisi ister.
6. Yetkili `/yonetim/odemeler` ekranı PayTR makbuzlarını canlı/test ayrımı, plan,
   tahsil edilen tutar ve `merchantOid` ile listeler. Bu görünüm callback kimliğini,
   müşteri iletişimini, adresi veya kart bilgisini istemez ve döndürmez. Referans
   PayTR mağaza panelindeki işlemle eşleştirilir; teslim yerel lisans yöneticisinden
   manuel yürütülür.

PayTR anahtarları kaynak dosyaya veya sohbete yapıştırılmaz; yalnız Vercel’in
Environment Variables bölümüne girilir. Şema değişikliği deploydan önce kontrollü
olarak uygulanır:

```bash
npx prisma db push
npm run test:paytr
npm run build
```

`PaymentReceipt` tablosu 8 Ağustos 2026'da mevcut Neon şemasına yalnız ekleme
olarak uygulanmış ve son salt okunur şema karşılaştırması boş dönmüştür. Sonraki
şema değişikliklerinde yine önce `prisma migrate diff`, sonra kontrollü `db push`
uygulanır.

Canlıya geçmeden önce PayTR panelinde bir test ödeme yapın. İşlem “Başarılı” ve
callback yanıtı `OK` görünmeden `PAYTR_DEBUG=0` yapmayın. İlk canlı teslimler,
PayTR panelindeki ödeme bilgisi doğrulanarak mevcut yerel lisans yöneticisinden
manuel yürütülür; callback müşteri e-postası taşımadığı için otomatik e-posta
teslimi bu gizlilik modelinde bilerek kapalıdır.

Mevcut Neon veritabanı eski tarihte migration tablosu olmadan kurulduğu için bu
projenin şema değişiklikleri kontrollü olarak `npx prisma db push` ile uygulanır;
build komutuna eklenmez.

---

## Günlük kullanım — "her şeyi Claude ile yönetmek"

- **Yazı / SEO / sayfa metni / fiyat / ayar:** Claude Desktop'ta iste → içerik MCP canlıya yazar. Anında.
- **Tasarım / yeni bölüm / kod:** Claude'a (Cowork'te) iste → kodu düzenler → Git'e iter →
  Vercel **önizleme linki** verir → beğenince yayına. Bozulursa Git'ten geri alınır.

## Sonra (gerekince)

- **Görsel yükleme kalıcılığı:** `POST /api/assets` şu an dosyayı `public/uploads/`a yazıyor;
  Vercel'de kalıcı değil. Cloudflare R2 / Vercel Blob'a çevrilecek (görsel yüklemeye güvenmeden önce).
- Doğum haritası çark motorunu SSR'a taşı (`HaritaAraci.jsx`).
