// Kamusal blog başlangıç içeriği.
// seed-data/library.json çalışma kütüphanesidir; oradaki taslak/başlık envanteri
// kamusal bloga kendiliğinden açılmaz. Yalnız burada veya DB'de açık yayın
// sözleşmesini (tarih + içerik + published) taşıyan yazılar görünür.
export const PUBLIC_BLOG_TREE = [
  {
    id: 'f-astroloji-programlari',
    type: 'folder',
    title: 'Astroloji Programları',
    glyph: '☿',
    children: [
      {
        id: 'astroloji-programi-nedir-nasil-secilir',
        type: 'page',
        title: 'Astroloji Programı Nedir, Nasıl Seçilir?',
        glyph: '☿',
        date: '2026-08-18',
        excerpt: 'Bir astroloji programının ne hesapladığını, yorum sürecinde nerede durduğunu ve doğru yazılımı seçerken hangi ölçütlere bakılması gerektiğini anlatan başlangıç rehberi.',
        seo: {
          title: 'Astroloji Programı Nedir, Nasıl Seçilir? | Hermes',
          description: 'Astroloji programlarının ne yaptığını ve doğru harita hesabı için program seçerken hangi özelliklere bakılması gerektiğini öğrenin.'
        },
        md: `Astroloji programı, doğum tarihi, saat ve yer bilgisini bir haritaya dönüştüren hesaplama ve çalışma aracıdır. Gezegenlerin zodyaktaki konumlarını, evleri, açıları ve seçilen tekniğe göre farklı zaman katmanlarını düzenli biçimde gösterir. Fakat haritanın anlamını tek başına belirlemez. Hesap programın, yorum ise astrologun sorumluluğundadır.

Bu ayrım önemlidir. İyi bir astroloji yazılımı gökyüzünü doğru hesaplar, karmaşık veriyi okunabilir kılar ve astrologun dikkatini teknik tekrar işlerinden kurtarır. Kötü seçilmiş ya da sınırları bilinmeden kullanılan bir program ise çok sayıda veri üretip asıl soruyu görünmez hâle getirebilir.

## Astroloji programı tam olarak ne yapar?

Bir doğum haritasının arkasında yalnız burç isimleri yoktur. Program, verilen an için Güneş, Ay ve gezegenlerin boylamlarını hesaplar; doğum yerine göre yükseleni, Tepe Noktası'nı ve ev başlangıçlarını kurar. Ardından kavuşum, kare, üçgen gibi açıları seçilen orb sınırlarına göre bulur.

Doğum saati ve konum bu nedenle birer ayrıntı değildir. Aynı gün doğan iki kişinin gezegen konumları birbirine yakın olsa da yükselenleri ve ev yerleşimleri farklı olabilir. Güvenilir bir doğum haritası programı, saat dilimi ve coğrafi koordinat gibi görünmeyen hesap katmanlarını tutarlı biçimde ele almalıdır.

Profesyonel programlar natal haritanın ötesine de geçer. Transitler, sekonder progresyonlar, Güneş dönüşü, sinastri, horary, elektif astroloji, rektifikasyon ve astrokartografi gibi yöntemler aynı temel veriyi farklı sorular için işler. Burada çok araç sahibi olmak tek başına üstünlük değildir. Önemli olan, kullanılan tekniğin hesabının açık olması ve astrologun yöntemini desteklemesidir.

## Program hesaplar, astrolog anlamlandırır

Astroloji yazılımı güçlü bir mercek olabilir; fakat haritaya hangi soruyla bakılacağını seçemez. Örneğin Satürn'ün bir eve girişi hesaplanabilir bir olgudur. Bunun bir insanın yaşamında sorumluluk, sınır, sabır ya da yapı kurma temalarından hangisini öne çıkaracağı ise haritanın bütünü ve kişinin gerçek hayat bağlamıyla birlikte değerlendirilir.

Otomatik yorumlar çoğu zaman tek bir yerleşimi bütün kişiliğin yerine koyar. Bu yaklaşım, kişiyi haritanın öznesi olmaktan çıkarır. Oysa aynı gösterge düşük ifadede katılaşmaya, olgun ifadede sınır kurma becerisine dönüşebilir. Program olasılık alanını görünür kılar; o alanın nasıl yaşandığını insanın farkındalığı, deneyimi ve seçimi belirler.

Bu yüzden iyi bir program astrologun yerini almaya çalışmaz. Hesabı güvenilir, yöntemi izlenebilir ve ekranı düşünmeye elverişli bir zemin sunar.

## Doğru astroloji programı nasıl seçilir?

### 1. Hesap altyapısını inceleyin

İlk ölçüt görsel güzellik değil, hesap güvenidir. Programın hangi efemeris altyapısını kullandığı, saat dilimlerini nasıl ele aldığı ve ev sistemi seçeneklerini açıkça belirtip belirtmediği önemlidir. Swiss Ephemeris gibi yerleşik efemeris kaynakları, gezegen konumlarının hesaplanmasında yaygın biçimde kullanılır.

Program farklı tarihlerde ve şehirlerde aynı veriyi tutarlı biçimde üretmeli; yaz saati uygulamaları gibi tarihsel ayrıntıları sessizce geçmemelidir. Özellikle rektifikasyon, horary ve seçim astrolojisinde birkaç dakikalık fark bile yükselen ve ev yerleşimlerini etkileyebilir.

### 2. Kullandığınız tekniklerle uyumuna bakın

Her astrolog aynı yöntemle çalışmaz. Yalnız doğum haritası yorumlayan biri ile Uranyen teknikler, astrokartografi ya da zaman yöneticileri kullanan birinin ihtiyaçları farklıdır. Bu nedenle uzun özellik listesine değil, kendi çalışma düzeninizde gerçekten kullanacağınız araçlara bakın.

Bir tekniğin programda bulunması da yeterli değildir. Ayarlarının görünür olması, orb ve ev sistemi gibi seçimlerin kullanıcı tarafından denetlenebilmesi gerekir. Araç, yöntemin önüne geçmemeli; yöntemi taşımalıdır.

### 3. Haritanın okunabilirliğini değerlendirin

İyi bir harita çok renkli olan değil, katmanları birbirine karıştırmadan gösterendir. Gezegenler, evler, açılar ve ek noktalar arasında açık bir görsel hiyerarşi bulunmalıdır. Gerektiğinde ayrıntıyı açabilmek, gerekmediğinde kapatabilmek zihinsel yükü azaltır.

Bir danışmanlık görüşmesinde astrologun dikkati menülerle mücadeleye değil, haritadaki merkezî örüntüye yönelmelidir. Hızlı çalışan, düzeni hatırlayan ve farklı ekranlarda okunabilir kalan bir arayüz bu yüzden yalnız estetik değil, mesleki bir ihtiyaçtır.

### 4. Kayıt, gizlilik ve dışa aktarma seçeneklerini sorun

Doğum bilgileri kişisel veridir. Programın danışan kayıtlarını nerede sakladığı, internet bağlantısını ne için kullandığı ve veriyi dışa aktarma ya da yedekleme imkânı sunup sunmadığı açık olmalıdır. Bulut zorunluluğu bulunmayan yerel çalışma, bazı astrologlar için önemli bir gizlilik tercihidir.

Rapor, görsel veya PDF üretimi de iş akışının parçasıdır. Haritayı danışanla paylaşırken okunabilir bir çıktı alabilmek, ekran görüntüsü toplamaktan daha güvenli ve düzenli bir yöntem sunar.

### 5. Sınırlarını dürüstçe anlatan yazılımı seçin

Hiçbir astroloji programı tek tuşla kusursuz yorum üretmez. Böyle bir vaat, astrolojik sembollerin bağlama göre değişen doğasını görmezden gelir. Güvenilir bir ürün neyi hesapladığını, neyi kullanıcıya bıraktığını ve hangi platformlarda çalıştığını açıkça söyler.

Deneme sürümü, ayrıntılı özellik sayfası, güncelleme politikası ve ulaşılabilir destek kanalı seçim yapmayı kolaylaştırır. Satın almadan önce lisansın kaç cihazda geçerli olduğunu ve güncellemelerin kapsama dahil olup olmadığını da kontrol etmek gerekir.

## Ücretsiz program mı, profesyonel yazılım mı?

Ücretsiz doğum haritası araçları öğrenmeye başlamak ve temel bir harita çıkarmak için yeterli olabilir. Ancak düzenli danışan kaydı, çoklu teknik, özelleştirilebilir orb ve görünüm ayarları, gelişmiş raporlama ya da yerel veri yönetimi gerektiğinde profesyonel bir astroloji programı daha bütünlüklü bir çalışma alanı sunar.

Buradaki asıl soru “ücretli mi, ücretsiz mi?” değildir. Aracın yaptığınız işe uygunluğu, hesap güveni ve size kazandırdığı berraklıktır. Kullanmadığınız yüzlerce özellik yerine, kullandığınız yöntemi derinleştiren sağlam bir çalışma düzeni daha değerlidir.

## Hermes bu çalışma düzeninde nerede duruyor?

[Hermes](/ozellikler), profesyonel astroloji çalışmalarını tek bir masaüstü ortamında toplamak için geliştirilen Türkçe bir Windows programıdır. Doğum haritası, öngörü teknikleri, sinastri, horary, rektifikasyon, astrokartografi ve Uranyen çalışmalar aynı danışan arşivi içinde birlikte yürütülebilir. Hesap motoru Swiss Ephemeris kullanır; harita ve danışan verileri kullanıcının cihazında tutulur.

Hermes'in amacı astrolog adına hüküm vermek değil, hesap ile yorum arasındaki alanı daha sakin ve izlenebilir kılmaktır. Çünkü iyi bir araç yalnız daha hızlı sonuç üretmez. Astrologun haritadaki asıl örüntüyü görmesi için gereksiz gürültüyü azaltır.

## Sonuç

Astroloji programı bir kehanet makinesi değil, teknik bir çalışma arkadaşıdır. Doğru yazılım gökyüzü verisini güvenilir biçimde hesaplar, yöntemi düzenler ve yorum için temiz bir yüzey açar. Yine de harita insanın yerine karar vermez; yalnız onun önündeki olasılıkları daha görünür kılar.

Seçim yaparken önce hesabı, sonra çalışma düzenini ve veri güvenliğini değerlendirin. Programın çok şey söylemesine değil, doğru şeyi açıkça göstermesine bakın.`
      }
    ]
  }
];
