// YASAL — /yasal/[slug]. Şirket kimliği merkezi site sabitlerinden gelir.
import { notFound } from 'next/navigation';
import {
  COMPANY_ADDRESS,
  COMPANY_LEGAL_NAME,
  COMPANY_TAX_OFFICE,
  COMPANY_TAX_NUMBER_DISPLAY,
  CONTACT_EMAIL,
  SITE,
  ORG,
  WEBSITE,
  pageMeta
} from '@/lib/site';
import { JsonLd } from '@/components/JsonLd';
import { Nav, Footer, T, kickerStyle, sectionStyle } from '@/components/Chrome';

const h2 = { fontFamily: T.serif, fontWeight: 460, fontSize: 34, margin: 0 };
const h3 = { fontFamily: T.serif, fontWeight: 500, fontSize: 22, margin: '34px 0 0' };
const p = { fontSize: 15.5, lineHeight: 1.75, color: T.ink2, margin: '10px 0 0' };
const ul = { fontSize: 15.5, lineHeight: 1.8, color: T.ink2, margin: '10px 0 0', paddingLeft: 22 };
const sub = { fontSize: 13, color: T.muted, marginTop: 8 };
const B = ({ children }) => <span style={{ fontWeight: 600 }}>{children}</span>;
const SELLER = <>{COMPANY_LEGAL_NAME} — {COMPANY_ADDRESS} — Vergi Dairesi: {COMPANY_TAX_OFFICE} — Vergi No: {COMPANY_TAX_NUMBER_DISPLAY} — {CONTACT_EMAIL}</>;

const DOCS = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    desc: '6698 sayılı KVKK uyarınca hermesastroloji.com aydınlatma metni: işlenen veriler, ödeme gizliliği, amaçlar, aktarım, saklama ve başvuru hakları.',
    body: (
      <>
        <h1 style={h2}>KVKK Aydınlatma Metni</h1>
        <div style={sub}>6698 sayılı Kişisel Verilerin Korunması Kanunu m.10 uyarınca · Yürürlük: 11 Ağustos 2026</div>
        <h2 style={h3}>1. Veri sorumlusu</h2>
        <p style={p}>Bu sitede işlenen kişisel veriler bakımından veri sorumlusu <B>{COMPANY_LEGAL_NAME}</B>, {COMPANY_ADDRESS} adresinde yerleşiktir. Başvurularınızı {CONTACT_EMAIL} adresine iletebilirsiniz.</p>
        <h2 style={h3}>2. Hangi verileri işliyoruz</h2>
        <ul style={ul}>
          <li><B>İletişim ve destek:</B> iletişim formunu, e-posta veya WhatsApp kanalını kullanmanız hâlinde paylaştığınız ad, iletişim bilgisi ve mesaj içeriği.</li>
          <li><B>Satın alma, lisans ve teslim:</B> sözleşmenin kurulması, ödeme kaydının eşleştirilmesi, indirme erişimi, lisansın hazırlanması ve destek için verdiğiniz ad, e-posta, telefon ve lisans bilgileri.</li>
          <li><B>Ödeme mutabakatı:</B> seçilen lisans planı, tutar, para birimi, PayTR işlem referansı, ödeme türü, durum ve işlem zamanı.</li>
          <li><B>Yasal kayıtlar:</B> fatura ve muhasebe mevzuatı gereği edinilen bilgiler, yalnız zorunlu süre ve kapsamda.</li>
        </ul>
        <p style={p}><B>Ödeme ve fatura gizliliği:</B> Hermes satın alma sayfası teslimat ve fatura düzenleme için ad-soyad, e-posta, telefon, fatura türü, TCKN veya VKN, gerekiyorsa ticari unvan/vergi dairesi ve fatura adresini ödeme öncesinde alır. Kart numarası, son kullanma tarihi ve CVV doğrudan PayTR’nin güvenli sayfasına girilir; Hermes/Vercel uygulamasından geçmez.</p>
        <h2 style={h3}>3. Amaç ve hukuki sebepler</h2>
        <ul style={ul}>
          <li>Sözleşmenin kurulması ve ifası; ödeme mutabakatı, lisans ve dijital teslim işlemleri — KVKK m.5/2-c.</li>
          <li>Fatura, muhasebe ve tüketici işlemi kayıtlarının tutulması — hukuki yükümlülük, KVKK m.5/2-ç.</li>
          <li>Talep, destek ve uyuşmazlık süreçlerinin yönetilmesi — hakkın tesisi/kullanılması ve meşru menfaat, KVKK m.5/2-e ve f.</li>
        </ul>
        <h2 style={h3}>4. Aktarım</h2>
        <p style={p}>Veriler satılmaz ve reklam amacıyla paylaşılmaz. Hizmetin gerektirdiği ölçüde ödeme kuruluşu PayTR’ye, e-posta/barındırma altyapısı sağlayıcılarına, mali müşavire ve kanuni zorunluluk hâlinde yetkili kurumlara aktarılabilir. Her sağlayıcı kendi rolü ve gizlilik koşulları kapsamında işlem yapar.</p>
        <h2 style={h3}>5. Saklama ve güvenlik</h2>
        <p style={p}>Kayıtlar, ilgili amaç ve mevzuat için gereken süre boyunca saklanır; süre sonunda silinir, yok edilir veya anonimleştirilir. Satın alma uygulamasındaki veri minimizasyonu kart verisi sızıntısı alanını daraltır; aktarım HTTPS ile korunur ve yönetim erişimleri yetkilendirilir.</p>
        <h2 style={h3}>6. Haklarınız</h2>
        <p style={p}>KVKK m.11 kapsamındaki bilgi alma, düzeltme, silme/yok etme, aktarılan kişileri öğrenme, otomatik sonuçlara itiraz ve zararın giderilmesini isteme haklarınız için {CONTACT_EMAIL} adresine başvurabilirsiniz. Başvurular kanuni süre içinde yanıtlanır.</p>
      </>
    )
  },
  gizlilik: {
    title: 'Gizlilik & Çerez Politikası',
    desc: 'hermesastroloji.com gizlilik ve çerez politikası: zorunlu depolama, ödeme gizliliği, üçüncü taraflar ve güvenlik.',
    body: (
      <>
        <h1 style={h2}>Gizlilik &amp; Çerez Politikası</h1>
        <div style={sub}>Yürürlük: 11 Ağustos 2026</div>
        <p style={{ ...p, margin: '26px 0 0' }}>İlkemiz veri minimizasyonudur: hizmet için gerekli olmayan kişisel bilgiyi istemeyiz; verileri satmaz ve reklam ağı oluşturmak için kullanmayız.</p>
        <h2 style={h3}>1. Çerezler ve yerel depolama</h2>
        <ul style={ul}>
          <li><B>Zorunlu işlevler:</B> tema tercihi, güvenli yönetim/indirme oturumu gibi işlevler için çerez veya tarayıcı yerel depolaması kullanılabilir.</li>
          <li><B>Analitik ve reklam:</B> sitede şu anda isteğe bağlı analitik veya reklam çerezi kullanılmaz.</li>
          <li><B>Üçüncü taraf bağlantıları:</B> PayTR, WhatsApp, YouTube veya Instagram’a geçtiğinizde ilgili hizmetin gizlilik ve çerez koşulları uygulanır.</li>
        </ul>
        <h2 style={h3}>2. Ödeme gizliliği</h2>
        <p style={p}>Hermes satın alma sayfası teslimat, iletişim ve fatura düzenleme için gerekli bilgileri ödeme öncesinde alır. Kartlı ödeme PayTR alan adında tamamlanır; kart numarası, son kullanma tarihi ve CVV Hermes sunucularından geçmez. Başarılı ödeme bildirimi satın alma kaydını eşleştirir, kişisel indirme davetini müşteriye ve satış/fatura özetini yetkili yönetici adreslerine gönderir. EFT/Havale talebi ayrıca Posta Merkezi’ne kaydedilir; WhatsApp’a yalnız talep ve teslim e-postası aktarılır.</p>
        <h2 style={h3}>3. Yönetim ve güvenlik</h2>
        <p style={p}>Tarayıcınızdan çerez ve yerel depolama kayıtlarını silebilirsiniz; zorunlu kayıtların engellenmesi bazı oturum özelliklerini çalışmaz hâle getirebilir. Bağlantılar HTTPS ile korunur, gizli anahtarlar yalnız sunucu ortamında tutulur ve kart bilgisi Hermes sunucularına alınmaz.</p>
        <h2 style={h3}>4. Değişiklikler ve iletişim</h2>
        <p style={p}>Önemli değişiklikler bu sayfadaki yürürlük tarihi güncellenerek yayımlanır. Sorularınız için {CONTACT_EMAIL} adresine yazabilirsiniz.</p>
      </>
    )
  },
  'on-bilgilendirme': {
    title: 'Ön Bilgilendirme Formu',
    desc: 'Hermes dijital lisansı için satıcı, ürün, fiyat, ödeme, teslimat, cayma ve başvuru bilgilerinin satın alma öncesi özeti.',
    body: (
      <>
        <h1 style={h2}>Ön Bilgilendirme Formu</h1>
        <div style={sub}>6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca · Yürürlük: 10 Ağustos 2026</div>
        <h2 style={h3}>1. Satıcı</h2><p style={p}>{SELLER}</p>
        <h2 style={h3}>2. Ürünün temel nitelikleri</h2>
        <p style={p}>Hermes, şu an Windows 10/11 bilgisayarlar için sunulan profesyonel astroloji yazılımının tek seferlik program lisansıdır. Her lisans yalnız etkinleştirildiği bir cihazda geçerlidir; farklı veya ikinci cihaz için ayrı lisans gerekir. Aynı cihaz için yayımlanan güncellemeler lisansa dahildir. macOS sürümü 17 Ağustos 2026’da, Android, iPhone ve iPad sürümleri ise daha sonra sunulacaktır. Cihazlar arası veri senkronizasyonu program lisansına dahil değildir; yayımlandığında ayrı abonelik koşullarına tabi olacaktır. Ürün gayri maddi/dijital olarak teslim edilir; fiziksel kargo yapılmaz.</p>
        <h2 style={h3}>3. Vergiler dâhil fiyat</h2>
        <ul style={ul}>
          <li><B>EFT/Havale:</B> 1 cihaz ₺6.000; 2 cihaz ₺8.500.</li>
          <li><B>Kartla tek çekim:</B> EFT hedef tutarı ve PayTR’nin güncel mağaza tek çekim oranına göre satın alma sayfasında otomatik hesaplanan tutardır.</li>
          <li><B>Taksit:</B> kart ve vade seçimine göre nihai toplam PayTR ödeme sayfasında gösterilir. Sipariş, bu toplam onaylandıktan sonra tamamlanır.</li>
        </ul>
        <h2 style={h3}>4. Ödeme, teslimat ve ek masraflar</h2>
        <p style={p}>Kartlı ödeme PayTR’nin güvenli ödeme sayfasında; EFT/Havale satıcının bildirdiği banka hesabına yapılır. Dijital teslim nedeniyle kargo ücreti yoktur. Başarılı kart ödemesi bildirildiğinde 6 saat geçerli kişisel indirme daveti satın alma sayfasında doğruladığınız e-posta adresine otomatik gönderilir. Programdaki <B>Lisans İste</B> kaydınızın ardından satın alınan cihaz sınırına uygun imzalı lisans en geç iki iş günü içinde hazırlanır.</p>
        <h2 style={h3}>5. Cayma ve iade</h2>
        <p style={p}>Tüketici kural olarak sözleşmenin kurulmasından itibaren 14 gün içinde cayabilir. Ancak açık onayınızla elektronik ortamda ifasına başlanan ve tarafınıza teslim edilen dijital içerik/lisans için Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ kapsamındaki cayma hakkı istisnası uygulanabilir. Lisans ve indirme erişimi teslim edilmeden önce iptal talebinde bulunabilirsiniz. Ayıplı hizmete ilişkin kanuni haklarınız saklıdır.</p>
        <h2 style={h3}>6. Başvuru ve uyuşmazlık</h2>
        <p style={p}>İptal, destek ve şikâyetler {CONTACT_EMAIL} adresine iletilebilir. Uyuşmazlıklarda, yürürlükteki parasal sınırlar kapsamında tüketicinin yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyeti ve Tüketici Mahkemeleri yetkilidir.</p>
      </>
    )
  },
  teslimat: {
    title: 'Teslimat ve Kargo Koşulları',
    desc: 'Hermes dijital lisansının ödeme doğrulaması, indirme erişimi, lisans teslim süresi ve fiziksel kargo bulunmadığına ilişkin koşullar.',
    body: (
      <>
        <h1 style={h2}>Teslimat ve Kargo Koşulları</h1>
        <div style={sub}>Yürürlük: 10 Ağustos 2026</div>
        <h2 style={h3}>1. Dijital teslimat</h2>
        <p style={p}>Hermes fiziksel ürün değildir. Kargo veya kurye gönderimi yapılmaz; bu nedenle kargo ücreti yoktur. Teslimat, Windows kurulumuna erişim ve satın alınan cihaz sınırına uygun lisansın hazırlanmasıyla dijital olarak tamamlanır.</p>
        <h2 style={h3}>2. Teslim süresi ve kanalı</h2>
        <p style={p}>Başarılı kart ödemesi PayTR tarafından bildirildiğinde 6 saat geçerli kişisel indirme daveti, satın alma sayfasında iki kez doğruladığınız e-posta adresine otomatik gönderilir. EFT/Havale ödemesinde davet banka hareketinin yönetici tarafından onaylanmasından sonra gönderilir. İmzalı lisans, programdaki <B>Lisans İste</B> kaydınızdan sonra satın alınan cihaz sınırına uygun biçimde <B>en geç iki iş günü içinde</B> hazırlanır.</p>
        <h2 style={h3}>3. Alıcının kontrolü</h2>
        <p style={p}>Satın alma sayfasında verdiğiniz e-posta adresinin doğru olması teslim için gereklidir. Ödeme başarılı olduğu hâlde indirme daveti ulaşmazsa gereksiz/spam klasörünü kontrol edip işlem referansınızla {CONTACT_EMAIL} adresine yazabilirsiniz. Kart bilgilerinizi hiçbir zaman e-postayla göndermeyin; fatura bilgisinde düzeltme gerekiyorsa işlem referansınızla destek isteyin.</p>
        <h2 style={h3}>4. Teknik sorun</h2>
        <p style={p}>Kurulum bağlantısı veya lisans teknik nedenle çalışmazsa destek sağlanır. Sorun makul sürede giderilemezse tüketicinin ayıplı mal/hizmete ilişkin seçimlik hakları ve <a href="/yasal/iade" style={{ color: T.purple }}>İptal &amp; İade Koşulları</a> uygulanır.</p>
      </>
    )
  },
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    desc: 'Hermes dijital lisansı mesafeli satış sözleşmesi: taraflar, fiyat, PayTR veya EFT ödeme, teslimat, cayma ve uyuşmazlık.',
    body: (
      <>
        <h1 style={h2}>Mesafeli Satış Sözleşmesi</h1>
        <div style={sub}>6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca · Yürürlük: 11 Ağustos 2026</div>
        <h2 style={h3}>1. Taraflar</h2>
        <p style={p}><B>Satıcı:</B> {SELLER}<br /><B>Alıcı:</B> Hermes satın alma sayfasında teslimat, iletişim ve fatura bilgilerini verip PayTR ödeme sayfasında veya EFT/Havale yoluyla siparişi tamamlayan kişi ya da kurum.</p>
        <h2 style={h3}>2. Konu ve ürün</h2>
        <p style={p}>Sözleşme, satın alma sayfasında seçilen 1 veya 2 cihazlık Hermes Astroloji Programı dijital lisansının satışı, ödemesi ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler. Her cihaz için ayrı lisans düzenlenir; lisans farklı cihazlar arasında ortak kullanılamaz. Cihazlar arası veri senkronizasyonu bu lisansın kapsamında değildir ve ileride ayrı abonelik koşullarıyla sunulacaktır.</p>
        <h2 style={h3}>3. Fiyat ve ödeme</h2>
        <p style={p}>Vergiler dâhil EFT/Havale fiyatı 1 cihaz için ₺6.000, 2 cihaz için ₺8.500’dür. Kartla tek çekim fiyatı PayTR’nin güncel mağaza oranıyla otomatik hesaplanarak satın alma sayfasında gösterilir. Taksitte kart/vade kaynaklı toplam PayTR ekranında değişebilir. Alıcının PayTR’de onayladığı nihai tutar sipariş bedelidir. Kart bilgileri Hermes sunucularına girilmez.</p>
        <h2 style={h3}>4. Sözleşmenin kurulması ve teslimat</h2>
        <p style={p}>Alıcı ön bilgilendirme ve sözleşme koşullarını onaylayıp ödemeyi tamamladığında sözleşme kurulur. Ürün yalnız dijital teslim edilir; kargo yoktur. Başarılı kart ödemesi bildirildiğinde 6 saatlik indirme daveti doğrulanan e-posta adresine otomatik gönderilir. İmzalı lisans, programdaki <B>Lisans İste</B> kaydından sonra en geç iki iş günü içinde hazırlanır.</p>
        <h2 style={h3}>5. Cayma hakkı</h2>
        <p style={p}>Alıcı kural olarak 14 gün içinde cayabilir. Alıcının açık onayıyla elektronik ortamda ifasına başlanan ve teslim edilen gayri maddi ürünlerde Yönetmelik m.15/1-ğ uyarınca cayma hakkı istisnası uygulanır. Dijital teslim tamamlanmadan önce iptal talebi kabul edilir. Ayıplı mal veya hizmete ilişkin emredici kanuni haklar saklıdır.</p>
        <h2 style={h3}>6. İade ve uyuşmazlık</h2>
        <p style={p}>Onaylanan iade, kullanılan ödeme aracına uygun yöntemle ve kanuni süre içinde yapılır. Uyuşmazlıklarda yürürlükteki parasal sınırlar dâhilinde Alıcının yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p>
      </>
    )
  },
  iade: {
    title: 'İptal & İade Koşulları',
    desc: 'Hermes dijital lisansı iptal ve iade koşulları: teslim öncesi iptal, cayma istisnası, teknik sorun ve geri ödeme süreci.',
    body: (
      <>
        <h1 style={h2}>İptal &amp; İade Koşulları</h1>
        <div style={sub}>Yürürlük: 8 Ağustos 2026</div>
        <h2 style={h3}>1. Teslimden önce</h2>
        <p style={p}>İndirme erişimi ve lisans teslim edilmeden önce {CONTACT_EMAIL} adresine işlem referansınızla yazarak iptal talep edebilirsiniz. Onaylanan iptalde tahsil edilen bedel kesintisiz iade edilir.</p>
        <h2 style={h3}>2. Dijital teslimden sonra</h2>
        <p style={p}>Açık onayınızla elektronik ortamda ifasına başlanan ve teslim edilen gayri maddi ürünlerde Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca cayma hakkı istisnası uygulanır. Bu istisna, programın ayıplı olması hâlindeki ücretsiz onarım, bedel indirimi, sözleşmeden dönme ve diğer emredici kanuni hakları ortadan kaldırmaz.</p>
        <h2 style={h3}>3. Teknik sorun</h2>
        <p style={p}>Programın belgelenebilir bir teknik sorun nedeniyle çalışmaması hâlinde önce destek ve düzeltme sağlanır. Sorun makul sürede giderilemezse somut duruma uygun kanuni seçimlik hak uygulanır.</p>
        <h2 style={h3}>4. İade yöntemi ve süre</h2>
        <p style={p}>Talebinizi {CONTACT_EMAIL} adresine PayTR işlem referansı veya EFT açıklamasıyla iletin; kart numarası veya kimlik belgesi göndermeyin. Onaylanan bedel, ödemenin yapıldığı araca uygun yöntemle en geç 14 gün içinde iade edilir. Bankanın hesaba yansıtma süresi ayrıca değişebilir.</p>
      </>
    )
  }
};

const MENU = [
  ['kvkk', 'KVKK Aydınlatma Metni'],
  ['gizlilik', 'Gizlilik & Çerez Politikası'],
  ['on-bilgilendirme', 'Ön Bilgilendirme Formu'],
  ['teslimat', 'Teslimat ve Kargo Koşulları'],
  ['mesafeli-satis', 'Mesafeli Satış Sözleşmesi'],
  ['iade', 'İptal & İade Koşulları']
];

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata(props) {
  const params = await props.params;
  const doc = DOCS[params.slug];
  if (!doc) return { title: 'Bulunamadı' };
  return pageMeta({ title: `${doc.title} — Hermes`, description: doc.desc, path: `/yasal/${params.slug}` });
}

export default async function Yasal(props) {
  const params = await props.params;
  const doc = DOCS[params.slug];
  if (!doc) notFound();
  const url = `${SITE}/yasal/${params.slug}`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [
    ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: `${doc.title} — Hermes`, description: doc.desc, isPartOf: { '@id': SITE + '/#site' }, inLanguage: 'tr-TR' }
  ] };

  return (
    <main>
      <JsonLd data={jsonld} />
      <Nav />
      <section style={{ ...sectionStyle, paddingTop: 54 }}>
        <div style={kickerStyle}>YASAL BİLGİLER</div>
        <div className="h-legal-layout" style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 48, marginTop: 40, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MENU.map(([slug, label]) => (
              <a key={slug} href={`/yasal/${slug}`} style={{ padding: '10px 14px', borderRadius: 10, fontSize: 14.5, textDecoration: 'none', color: slug === params.slug ? T.ink : T.muted, background: slug === params.slug ? T.cream : 'transparent', fontWeight: slug === params.slug ? 600 : 400 }}>{label}</a>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 14, fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
              Sorunuz için <a href="/iletisim" style={{ color: T.purple }}>iletişim formu</a>
            </div>
          </div>
          <article style={{ maxWidth: 720 }}>{doc.body}</article>
        </div>
      </section>
      <Footer />
    </main>
  );
}
