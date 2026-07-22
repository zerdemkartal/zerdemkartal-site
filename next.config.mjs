/** @type {import('next').NextConfig} */
// H1 dönüşümü: eski zerdemkartal rotaları kaldırıldı → 301 kalıcı yönlendirme (SEO korunumu).
const nextConfig = {
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
