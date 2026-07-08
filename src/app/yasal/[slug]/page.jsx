// YASAL — /yasal/[slug] (Yasal.dc.html'in SSR portu; hash router yerine gerçek URL'ler).
// Metinler prototipten birebir taşındı. [köşeli] alanlar yayına almadan doldurulmalı + hukukçu okuması şart.
import { notFound } from 'next/navigation';
import { SITE, ORG, WEBSITE, pageMeta } from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, sectionStyle } from '@/components/Chrome';

const h2 = { fontFamily: T.serif, fontWeight: 460, fontSize: 34, margin: 0 };
const h3 = { fontFamily: T.serif, fontWeight: 500, fontSize: 22, margin: '34px 0 0' };
const p = { fontSize: 15.5, lineHeight: 1.75, color: T.ink2, margin: '10px 0 0' };
const ul = { fontSize: 15.5, lineHeight: 1.8, color: T.ink2, margin: '10px 0 0', paddingLeft: 22 };
const sub = { fontSize: 13, color: T.muted, marginTop: 8 };
const Bosluk = ({ children }) => <span style={{ background: T.cream, border: '1px dashed #D8D2C4', borderRadius: 6, padding: '0 8px', fontWeight: 600 }}>{children}</span>;
const B = ({ children }) => <span style={{ fontWeight: 600 }}>{children}</span>;

const DOCS = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    desc: '6698 sayılı KVKK m.10 uyarınca zerdemkartal.com aydınlatma metni: işlenen veriler, amaçlar, aktarım, saklama süresi ve haklarınız.',
    body: (
      <>
        <h1 style={h2}>KVKK Aydınlatma Metni</h1>
        <div style={sub}>6698 sayılı Kişisel Verilerin Korunması Kanunu m.10 uyarınca · Yürürlük: 7 Temmuz 2026</div>
        <h2 style={h3}>1. Veri sorumlusu</h2>
        <p style={p}>Bu sitede (zerdemkartal.com) toplanan kişisel verileriniz bakımından veri sorumlusu, <Bosluk>[unvan / ad soyad]</Bosluk>, <Bosluk>[adres]</Bosluk> (&quot;zerdemkartal&quot;) olup her türlü talebiniz için merhaba@zerdemkartal.com adresine yazabilirsiniz.</p>
        <h2 style={h3}>2. Hangi verileri işliyoruz</h2>
        <ul style={ul}>
          <li><B>Kimlik ve iletişim:</B> ad soyad, e-posta adresi (üyelik, iletişim formu, talep ve ön sipariş formları).</li>
          <li><B>Doğum bilgileri:</B> doğum tarihi, saati ve yeri — yalnızca doğum haritası hesaplaması ve danışmanlık hizmeti için, siz girdiğinizde.</li>
          <li><B>Üyelik ve kullanım verileri:</B> hesap bilgileri, Astroloji 101 çalışma ilerlemesi, site tercihleri.</li>
          <li><B>İşlem bilgileri:</B> danışmanlık talepleri, ön sipariş kayıtları ve yazışma geçmişi.</li>
        </ul>
        <h2 style={h3}>3. İşleme amaçları ve hukuki sebepler</h2>
        <ul style={ul}>
          <li>Danışmanlık, program satışı ve üyelik hizmetlerinin sunulması — <span style={{ color: T.muted }}>sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</span></li>
          <li>Talep ve sorulara dönüş yapılması — <span style={{ color: T.muted }}>meşru menfaat (m.5/2-f)</span></li>
          <li>Doğum bilgilerinizle harita hesaplanması ve yorumlanması — <span style={{ color: T.muted }}>açık rıza (m.5/1)</span></li>
          <li>Fatura ve kayıt yükümlülükleri — <span style={{ color: T.muted }}>hukuki yükümlülük (m.5/2-ç)</span></li>
        </ul>
        <h2 style={h3}>4. Kimlere aktarılabilir</h2>
        <p style={p}>Verileriniz satılmaz, reklam amacıyla paylaşılmaz. Yalnızca hizmetin gerektirdiği ölçüde; barındırma ve e-posta altyapı sağlayıcılarına, ödeme aşamasında ödeme kuruluşuna (ör. iyzico/PayTR) ve yasal zorunluluk hâlinde yetkili kurumlara aktarılabilir. Sunucuların yurt dışında bulunması hâlinde aktarım, KVKK m.9&#39;daki şartlara uygun yürütülür.</p>
        <h2 style={h3}>5. Saklama süresi</h2>
        <p style={p}>Veriler, amaç için gerekli süre ve ilgili mevzuattaki zamanaşımı süreleri boyunca saklanır; süre dolduğunda silinir, yok edilir veya anonim hâle getirilir. Üyeliğinizi sildirdiğinizde hesap verileriniz, yasal saklama yükümlülükleri saklı kalmak üzere kaldırılır.</p>
        <h2 style={h3}>6. Haklarınız (KVKK m.11)</h2>
        <p style={p}>Verinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amaca uygun kullanılıp kullanılmadığını öğrenme, düzeltilmesini veya silinmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuçlara itiraz etme ve zarara uğramanız hâlinde tazminat talep etme hakkına sahipsiniz. Başvurunuzu merhaba@zerdemkartal.com adresine iletebilirsiniz; en geç 30 gün içinde yanıtlanır.</p>
      </>
    )
  },
  gizlilik: {
    title: 'Gizlilik & Çerez Politikası',
    desc: 'zerdemkartal.com gizlilik ve çerez politikası: çerezler, yerel depolama, doğum bilgileri, güvenlik ve değişiklikler.',
    body: (
      <>
        <h1 style={h2}>Gizlilik &amp; Çerez Politikası</h1>
        <div style={sub}>Yürürlük: 7 Temmuz 2026</div>
        <p style={{ ...p, margin: '26px 0 0' }}>Bu politika, zerdemkartal.com&#39;u ziyaret ettiğinizde hangi bilgilerin, ne amaçla ve hangi araçlarla işlendiğini açıklar. İlke basit: <B>yalnızca hizmet için gerekeni toplarız, veri satmayız, reklam ağlarıyla paylaşmayız.</B></p>
        <h2 style={h3}>1. Çerezler ve yerel depolama</h2>
        <ul style={ul}>
          <li><B>Zorunlu:</B> oturumunuzu ve site tercihlerinizi hatırlamak için çerez ve tarayıcı yerel depolaması (localStorage) kullanılır. Üyelik oturumu, Astroloji 101 ilerlemesi ve doğum haritası girdileriniz bu kapsamdadır.</li>
          <li><B>Analitik:</B> kullanılıyorsa, hangi sayfaların ziyaret edildiğini anonim/toplu olarak ölçer; kimliğinizle eşleştirilmez. <Bosluk>[kullanılan analitik aracı]</Bosluk></li>
          <li><B>Üçüncü taraf içerikler:</B> sayfalara gömülü YouTube/Instagram içerikleri, kendi sağlayıcılarının çerezlerini kullanabilir.</li>
        </ul>
        <h2 style={h3}>2. Çerezleri yönetme</h2>
        <p style={p}>Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri/yerel depolamayı engellemeniz hâlinde üyelik oturumu ve ilerleme kaydı gibi özellikler çalışmayabilir.</p>
        <h2 style={h3}>3. Doğum bilgileri hakkında özel not</h2>
        <p style={p}>Doğum tarihi, saati ve yeri astrolojik hesaplama için hassas kişisel bilgidir. Bu bilgileri yalnızca siz girdiğinizde ve yalnızca harita hesaplaması/danışmanlık için kullanırız; üçüncü kişilerle paylaşılmaz.</p>
        <h2 style={h3}>4. Güvenlik</h2>
        <p style={p}>Veriler şifreli bağlantı (HTTPS) üzerinden taşınır; erişim, işin gerektirdiği kişilerle sınırlıdır. İnternette hiçbir aktarım %100 güvenli değildir; bir ihlal fark edilirse etkilenen kullanıcılar makul sürede bilgilendirilir.</p>
        <h2 style={h3}>5. Değişiklikler</h2>
        <p style={p}>Bu politika güncellenebilir; önemli değişiklikler bu sayfada yürürlük tarihiyle duyurulur. Sorularınız için: merhaba@zerdemkartal.com</p>
      </>
    )
  },
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    desc: 'zerdemkartal.com mesafeli satış sözleşmesi: taraflar, konu, fiyat ve ödeme, teslimat, cayma hakkı ve uyuşmazlık.',
    body: (
      <>
        <h1 style={h2}>Mesafeli Satış Sözleşmesi</h1>
        <div style={sub}>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca · Yürürlük: 7 Temmuz 2026</div>
        <h2 style={h3}>1. Taraflar</h2>
        <p style={p}><B>Satıcı:</B> <Bosluk>[unvan / ad soyad]</Bosluk> — <Bosluk>[adres]</Bosluk> — <Bosluk>[vergi dairesi / no]</Bosluk> — merhaba@zerdemkartal.com<br /><B>Alıcı:</B> sipariş formunda ad, soyad ve e-posta bilgilerini veren kişi.</p>
        <h2 style={h3}>2. Konu</h2>
        <p style={p}>Sözleşmenin konusu, zerdemkartal.com üzerinden satışa sunulan <B>dijital ürünlerin</B> (Hermes Astroloji Programı lisansı) ve <B>danışmanlık hizmetlerinin</B> (astroloji analiz seansları) satışı ve teslimine ilişkin tarafların hak ve yükümlülükleridir. AstroPen ücretsizdir ve bu sözleşmenin kapsamı dışındadır.</p>
        <h2 style={h3}>3. Ürün, fiyat ve ödeme</h2>
        <p style={p}>Ürün/hizmetin temel nitelikleri ve vergiler dâhil satış fiyatı, sipariş anında ilgili sayfada yazan bilgilerdir. Ön satış döneminde Hermes lisansı, ilan edilen ön satış bedeli üzerinden satılır; program yayınlandığında ek ücret talep edilmez. Ödeme, sitede sunulan ödeme kuruluşu aracılığıyla yapılır.</p>
        <h2 style={h3}>4. Teslimat</h2>
        <ul style={ul}>
          <li><B>Dijital ürün:</B> lisans anahtarı ve indirme bağlantısı, ödemenin onaylanmasının ardından (ön satışta: program yayınlandığında) Alıcının e-posta adresine gönderilir.</li>
          <li><B>Danışmanlık:</B> taraflarca kararlaştırılan randevu tarihinde, çevrim içi veya yüz yüze ifa edilir.</li>
        </ul>
        <h2 style={h3}>5. Cayma hakkı</h2>
        <p style={p}>Alıcı, 14 gün içinde gerekçe göstermeksizin cayma hakkına sahiptir. Ancak Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca, <B>elektronik ortamda anında ifa edilen ve Alıcıya anında teslim edilen gayri maddi mallarda</B> (lisans anahtarı teslim edilmiş dijital ürün) cayma hakkı kullanılamaz; Alıcı sipariş sırasında bu durumu onaylar. Danışmanlık hizmetinde, hizmetin ifasına başlanmadan önce cayma hakkı saklıdır; ifa başladıktan sonra m.15/1-h uygulanır. Ayrıntılar için <a href="/yasal/iade" style={{ color: T.purple }}>İptal &amp; İade Koşulları</a>.</p>
        <h2 style={h3}>6. Uyuşmazlık</h2>
        <p style={p}>Uyuşmazlıklarda, Ticaret Bakanlığınca ilan edilen parasal sınırlar dâhilinde Alıcının yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
        <h2 style={h3}>7. Yürürlük</h2>
        <p style={p}>Alıcı, siparişi onayladığında bu sözleşmenin tüm koşullarını kabul etmiş sayılır ve sözleşme kurulmuş olur; bir örneği talep hâlinde e-postayla gönderilir.</p>
      </>
    )
  },
  iade: {
    title: 'İptal & İade Koşulları',
    desc: 'zerdemkartal.com iptal ve iade koşulları: dijital ürünler (Hermes), danışmanlık seansları, ücretsiz içerikler ve iade süreci.',
    body: (
      <>
        <h1 style={h2}>İptal &amp; İade Koşulları</h1>
        <div style={sub}>Yürürlük: 7 Temmuz 2026</div>
        <h2 style={h3}>1. Dijital ürünler (Hermes)</h2>
        <ul style={ul}>
          <li>Lisans anahtarı <B>teslim edilmeden önce</B> siparişi iptal edebilirsin; ödemen kesintisiz iade edilir. Ön satış döneminde bu, program sana teslim edilene kadar geçerlidir.</li>
          <li>Lisans anahtarı teslim edildikten sonra, dijital içerik anında ifa edildiğinden cayma hakkı kullanılamaz (Yönetmelik m.15/1-ğ).</li>
          <li>Program teknik bir sorun nedeniyle çalışmıyorsa önce destek veririz; makul sürede çözülemezse ücret iadesi yapılır.</li>
        </ul>
        <h2 style={h3}>2. Danışmanlık seansları</h2>
        <ul style={ul}>
          <li>Randevundan <B>24 saat öncesine kadar</B> ücretsiz erteleyebilir veya iptal edebilirsin; iptalde ödemen tam iade edilir.</li>
          <li>Son 24 saat içindeki iptallerde ve randevuya gelinmemesi hâlinde ücret iadesi yapılmaz; bir kez ücretsiz erteleme hakkı tanınır.</li>
          <li>Seansın zerdemkartal tarafından iptali hâlinde yeni tarih önerilir; dilersen ücretin tamamı iade edilir.</li>
        </ul>
        <h2 style={h3}>3. Ücretsiz içerikler</h2>
        <p style={p}>AstroPen, Astroloji 101 ve blog içerikleri ücretsizdir; iade kapsamı dışındadır.</p>
        <h2 style={h3}>4. İade süreci</h2>
        <p style={p}>İade/iptal talebini sipariş e-postanla birlikte merhaba@zerdemkartal.com adresine ya da <a href="/iletisim" style={{ color: T.purple }}>iletişim formuna</a> yaz. Onaylanan iadeler, ödeme yaptığın karta en geç 14 gün içinde yansıtılır (bankana bağlı olarak ekstrene yansıması birkaç gün sürebilir).</p>
      </>
    )
  }
};

const MENU = [
  ['kvkk', 'KVKK Aydınlatma Metni'],
  ['gizlilik', 'Gizlilik & Çerez Politikası'],
  ['mesafeli-satis', 'Mesafeli Satış Sözleşmesi'],
  ['iade', 'İptal & İade Koşulları']
];

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const doc = DOCS[params.slug];
  if (!doc) return { title: 'Bulunamadı' };
  return pageMeta({ title: `${doc.title} — zerdemkartal`, description: doc.desc, path: `/yasal/${params.slug}` });
}

export default function Yasal({ params }) {
  const doc = DOCS[params.slug];
  if (!doc) notFound();
  const url = `${SITE}/yasal/${params.slug}`;

  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: `${doc.title} — zerdemkartal`, description: doc.desc, isPartOf: { '@id': SITE + '/#site' }, inLanguage: 'tr-TR' }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav />

      <section style={{ ...sectionStyle, paddingTop: 54 }}>
        <div style={kickerStyle}>YASAL BİLGİLER</div>
        <div style={{ marginTop: 22, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px', fontSize: 13.5, lineHeight: 1.6, color: '#55524A', maxWidth: 780 }}>
          Bu metinler zerdemkartal için hazırlanmış şablonlardır. Yayına almadan önce <Bosluk>köşeli</Bosluk> alanları gerçek bilgilerinle doldur ve bir hukukçuya son okuma yaptır.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 48, marginTop: 40, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MENU.map(([slug, label]) => (
              <a key={slug} href={`/yasal/${slug}`} style={{ padding: '10px 14px', borderRadius: 10, fontSize: 14.5, textDecoration: 'none', color: slug === params.slug ? T.ink : T.muted, background: slug === params.slug ? T.cream : 'transparent', fontWeight: slug === params.slug ? 600 : 400 }}>{label}</a>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 14, fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
              Sorusu olan: <a href="/iletisim" style={{ color: T.purple }}>iletişim formu</a>
            </div>
          </div>
          <div style={{ maxWidth: 720 }}>{doc.body}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
