/** @type {import('next').NextConfig} */
// H1 dönüşümü: eski zerdemkartal rotaları kaldırıldı → 301 kalıcı yönlendirme (SEO korunumu).
const nextConfig = {
  // iyzipay SDK'sı çalışma anında kendi 'resources' klasörünü diskten okur
  // (lib/Iyzipay.js: fs.readdirSync(__dirname + '/resources')). Webpack bundle'ına
  // gömülürse __dirname bundle klasörü olur → Vercel'de ENOENT. Çözüm:
  // 1) paketi bundle DIŞINDA tut (runtime'da node_modules'ten require edilir),
  // 2) dosyalarını serverless çıktısına dahil et (dinamik readdir nft izlemesine takılmaz).
  experimental: {
    serverComponentsExternalPackages: ['iyzipay'],
    outputFileTracingIncludes: {
      '/api/pay/iyzico/start': ['./node_modules/iyzipay/**'],
      '/api/pay/iyzico/callback': ['./node_modules/iyzipay/**']
    }
  },
  async redirects() {
    return [
      { source: '/programlar/hermes', destination: '/', permanent: true },
      { source: '/programlar/astropen', destination: '/', permanent: true },
      { source: '/programlar', destination: '/', permanent: true },
      { source: '/danismanliklar/analiz/:slug', destination: '/', permanent: true },
      { source: '/danismanliklar', destination: '/', permanent: true },
      { source: '/astroloji-101', destination: '/blog', permanent: true },
      { source: '/dogum-haritasi', destination: '/', permanent: true }
    ];
  }
};
export default nextConfig;
