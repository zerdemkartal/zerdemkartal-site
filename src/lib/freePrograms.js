const httpUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

export const FREE_PROGRAMS = [
  {
    id: 'astropen',
    name: 'AstroPen',
    version: '1.0.15',
    eyebrow: 'Ücretsiz masaüstü aracı',
    description: 'Ekranın üzerinde çizim, işaretleme ve anlatım yapmayı sağlayan şeffaf Windows aracı.',
    details: ['Windows 10/11', 'Lisans anahtarı ve hesap istemez', 'Yaklaşık 76,3 MB'],
    downloadUrl: httpUrl(process.env.ASTROPEN_PUBLIC_DOWNLOAD_URL),
    filename: 'AstroPen-Windows-1.0.15.zip',
    sha256: '590A018BF1D5A7B7435059BFA7D623218D0BE8813C89D3D45087CA9F8F2F47E6',
    trust: 'Kurulum şu anda kod imzası taşımıyor; Windows koruma uyarısı gösterebilir.'
  },
  {
    id: 'asteroid-yardimci',
    name: 'Asteroid Yardımcı',
    version: '0.2.0',
    eyebrow: 'Hermes Yardımcı Programı',
    description: 'Geniş asteroid arşivinde ad veya numarayla arama yapar ve seçilen efemeris dosyasını kontrollü biçimde dışa aktarır.',
    details: ['40.243 arama kimliği', '40.240 cisim', 'İmzalı Windows kurulumu · yaklaşık 1,83 GB'],
    downloadUrl: process.env.ASTEROID_HELPER_DISTRIBUTION_CLEARED === '1'
      ? httpUrl(process.env.ASTEROID_HELPER_PUBLIC_DOWNLOAD_URL)
      : '',
    filename: 'Hermes-Asteroid-Yardimci-Windows-0.2.0.zip',
    sha256: '498280885D513090A8DD941CF447333D6E70C6E884ECBA8A80009BCF5FB0811B',
    trust: 'İsteğe bağlı bir arşiv aracıdır; Hermes kurulumu veya lisansı için zorunlu değildir.',
    clearancePending: process.env.ASTEROID_HELPER_DISTRIBUTION_CLEARED !== '1'
  }
];
