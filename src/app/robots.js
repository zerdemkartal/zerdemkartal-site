// robots.txt — dinamik (kök robots.txt prototip dosyasının deploy karşılığı).
// AI botları bilinçli olarak açık (llms.txt ile birlikte); admin + API kapalı.
const SITE = (process.env.SITE_URL || 'https://zerdemkartal.com').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/yonetim', '/admin', '/api/', '/uye'] },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' }
    ],
    sitemap: SITE + '/sitemap.xml'
  };
}
